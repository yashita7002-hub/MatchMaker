import User, { IUser } from '@/models/User';
import mongoose from 'mongoose';
import { GoogleGenAI } from '@google/genai';

export interface IMatchResult {
  candidate: IUser;
  matchScore: number;
  reasons: string[];
  suggestedRole: string;
  isAiGenerated: boolean;
}

export interface IProjectContext {
  title?: string;
  description?: string;
}

interface GeminiCandidateEvaluation {
  candidateId: string;
  suggestedRole: string;
  semanticScore: number;
  reasons: string[];
}

export async function getRecommendations(
  requiredSkills: string[],
  requiredRoles: string[],
  excludeUserIds: string[],
  projectContext?: IProjectContext
): Promise<IMatchResult[]> {
  const excludeObjectIds = excludeUserIds
    .filter(id => mongoose.Types.ObjectId.isValid(id))
    .map(id => new mongoose.Types.ObjectId(id));

  const candidates = await User.find({ _id: { $nin: excludeObjectIds } });
  if (!candidates || candidates.length === 0) {
    return [];
  }

  const reqSkillsLower = requiredSkills.map(s => s.toLowerCase().trim());
  const reqRolesLower = requiredRoles.map(r => r.toLowerCase().trim());

  // 1. Calculate deterministic baseline for each candidate
  const deterministicResults: Array<{
    candidate: IUser;
    score: number;
    reasons: string[];
    suggestedRole: string;
  }> = [];

  for (const candidate of candidates) {
    let score = 0;
    const reasons: string[] = [];

    // Skill Overlap (0 - 35 pts)
    const candSkillsLower = (candidate.skills || []).map(s => s.toLowerCase().trim());
    const matchedSkills = reqSkillsLower.filter(s => candSkillsLower.includes(s));

    if (reqSkillsLower.length > 0) {
      const skillsScore = (matchedSkills.length / reqSkillsLower.length) * 35;
      score += skillsScore;
      if (matchedSkills.length > 0) {
        reasons.push(`Matches ${matchedSkills.length}/${requiredSkills.length} skills: ${matchedSkills.join(', ')}`);
      }
    } else {
      score += 35;
    }

    // Role Alignment (0 - 25 pts)
    const candRolesLower = (candidate.roles || []).map(r => r.toLowerCase().trim());
    const matchedRoles = reqRolesLower.filter(r => candRolesLower.includes(r));

    let candidateSuggestedRole = requiredRoles[0] || 'General Collaborator';
    if (reqRolesLower.length > 0) {
      if (matchedRoles.length > 0) {
        score += 25;
        // Use the original casing of the matched role
        const found = requiredRoles.find(r => r.toLowerCase().trim() === matchedRoles[0]);
        if (found) candidateSuggestedRole = found;
        reasons.push(`Role experience aligns: ${candidateSuggestedRole}`);
      }
    } else {
      score += 25;
    }

    // Public Code / Repositories Footprint (0 - 20 pts)
    let matchingReposCount = 0;
    if (candidate.repositories && candidate.repositories.length > 0) {
      for (const repo of candidate.repositories) {
        const repoLangLower = repo.language ? repo.language.toLowerCase().trim() : '';
        const repoNameLower = (repo.name || '').toLowerCase();
        const repoDescLower = (repo.description || '').toLowerCase();

        const langMatches = reqSkillsLower.includes(repoLangLower);
        const descMatches = reqSkillsLower.some(skill =>
          repoNameLower.includes(skill) || repoDescLower.includes(skill)
        );

        if (langMatches || descMatches) {
          matchingReposCount++;
        }
      }

      const repoRatio = Math.min(matchingReposCount / 3, 1);
      score += repoRatio * 20;
      if (matchingReposCount > 0) {
        reasons.push(`Has ${matchingReposCount} relevant public repositories`);
      }
    }

    // Availability Status (0 - 10 pts)
    if (candidate.status === 'Looking for Team') {
      score += 10;
      reasons.push('Actively seeking a squad');
    } else if (candidate.status === 'Available') {
      score += 7;
      reasons.push('Open to collaborate');
    } else if (candidate.status === 'Looking for Projects') {
      score += 5;
      reasons.push('Looking for projects');
    }

    // Trust Score (0 - 10 pts)
    if (candidate.trustScore && candidate.trustScore > 0) {
      const ratingScore = (candidate.trustScore / 5) * 10;
      score += ratingScore;
      if (candidate.trustScore >= 4.0) {
        reasons.push(`Strong trust score: ${candidate.trustScore.toFixed(1)}/5.0`);
      }
    } else {
      score += 8;
      reasons.push('Clean track record');
    }

    const finalScore = Math.min(Math.round(score), 100);

    deterministicResults.push({
      candidate,
      score: finalScore,
      reasons: reasons.length > 0 ? reasons : ['Verified platform member'],
      suggestedRole: candidateSuggestedRole,
    });
  }

  // Sort descending by deterministic score
  deterministicResults.sort((a, b) => b.score - a.score);

  // 2. Attempt Gemini Semantic Evaluation if API key is configured
  const apiKey = process.env.GEMINI_API_KEY;
  if (apiKey && apiKey.trim() !== '' && apiKey !== 'your_gemini_api_key') {
    try {
      const topCandidates = deterministicResults.slice(0, 12);
      const ai = new GoogleGenAI({ apiKey: apiKey.trim() });

      const prompt = `You are an expert developer team recruiter and AI matchmaking engine for "Project Matchmaker".
Evaluate candidate developers for a project.

PROJECT DETAILS:
- Title: ${projectContext?.title || 'Open Collaboration Project'}
- Description: ${projectContext?.description || 'Collaborative engineering project looking for builders.'}
- Required Skills: ${requiredSkills.join(', ') || 'General Development'}
- Required Roles: ${requiredRoles.join(', ') || 'Collaborator'}

CANDIDATES:
${topCandidates
  .map(
    (c, idx) => `Candidate #${idx + 1}:
- ID: ${c.candidate._id.toString()}
- Name: ${c.candidate.name} (@${c.candidate.githubUsername})
- Bio: ${c.candidate.bio || 'Developer'}
- Skills: ${(c.candidate.skills || []).join(', ') || 'None listed'}
- Roles: ${(c.candidate.roles || []).join(', ') || 'Developer'}
- Availability: ${c.candidate.status || 'Available'}
- Trust Score: ${c.candidate.trustScore || 0}/5.0
- Repositories: ${(c.candidate.repositories || []).slice(0, 4).map(r => `${r.name} (${r.language || 'Code'})`).join(', ') || 'None'}
`
  )
  .join('\n')}

INSTRUCTIONS:
1. Assess how well each candidate matches the project mission, tech stack, and needs.
2. Assign a suggested role for each candidate from the project's required roles if applicable, or a best-fit technical role.
3. Assign a semanticScore between 30 and 100 representing qualitative suitability, technical synergy, and experience alignment.
4. Provide 2-3 specific, factual reasons explaining why they are a strong fit for this project. Keep each reason under 12 words. Do NOT hallucinate skills they don't have.

Respond ONLY with a valid JSON array matching this schema:
[
  {
    "candidateId": "string",
    "suggestedRole": "string",
    "semanticScore": 85,
    "reasons": ["string", "string"]
  }
]`;

      let aiResponseText = '';
      try {
        const response = await ai.models.generateContent({
          model: 'gemini-3.5-flash-lite',
          contents: prompt,
          config: { responseMimeType: 'application/json' },
        });
        aiResponseText = response.text || '';
      } catch (liteErr: any) {
        console.warn('[Gemini 3.5 Flash Lite] failed, attempting gemini-3.5-flash fallback:', liteErr.message);
        const fallbackResponse = await ai.models.generateContent({
          model: 'gemini-3.5-flash',
          contents: prompt,
          config: { responseMimeType: 'application/json' },
        });
        aiResponseText = fallbackResponse.text || '';
      }

      if (aiResponseText) {
        const evaluations: GeminiCandidateEvaluation[] = JSON.parse(aiResponseText);
        const evalMap = new Map<string, GeminiCandidateEvaluation>();
        evaluations.forEach(ev => evalMap.set(ev.candidateId, ev));

        const hybridResults: IMatchResult[] = deterministicResults.map(item => {
          const cId = item.candidate._id.toString();
          const aiEval = evalMap.get(cId);

          if (aiEval) {
            // Defensible hybrid formula: 40% deterministic verified overlap + 60% Gemini semantic evaluation
            const hybridScore = Math.min(
              100,
              Math.max(15, Math.round(0.4 * item.score + 0.6 * aiEval.semanticScore))
            );

            return {
              candidate: item.candidate,
              matchScore: hybridScore,
              reasons: aiEval.reasons && aiEval.reasons.length > 0 ? aiEval.reasons : item.reasons,
              suggestedRole: aiEval.suggestedRole || item.suggestedRole,
              isAiGenerated: true,
            };
          }

          return {
            candidate: item.candidate,
            matchScore: item.score,
            reasons: item.reasons,
            suggestedRole: item.suggestedRole,
            isAiGenerated: false,
          };
        });

        return hybridResults.sort((a, b) => b.matchScore - a.matchScore);
      }
    } catch (aiErr: any) {
      console.warn('[Gemini AI] Recommendations pipeline caught error, falling back to deterministic:', aiErr.message);
    }
  }

  // Deterministic fallback if Gemini is unavailable or not configured
  return deterministicResults.map(item => ({
    candidate: item.candidate,
    matchScore: item.score,
    reasons: item.reasons,
    suggestedRole: item.suggestedRole,
    isAiGenerated: false,
  }));
}
