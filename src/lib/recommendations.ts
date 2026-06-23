import User, { IUser } from '@/models/User';
import mongoose from 'mongoose';

export interface IMatchResult {
  candidate: IUser;
  matchScore: number;
  reasons: string[];
}

export async function getRecommendations(
  requiredSkills: string[],
  requiredRoles: string[],
  excludeUserIds: string[]
): Promise<IMatchResult[]> {
  // Convert string IDs to mongoose ObjectIds for safety
  const excludeObjectIds = excludeUserIds.map(id => new mongoose.Types.ObjectId(id));
  
  // Fetch all users in database who are NOT excluded
  const candidates = await User.find({ _id: { $nin: excludeObjectIds } });
  
  const results: IMatchResult[] = [];
  
  const reqSkillsLower = requiredSkills.map(s => s.toLowerCase().trim());
  const reqRolesLower = requiredRoles.map(r => r.toLowerCase().trim());

  for (const candidate of candidates) {
    let score = 0;
    const reasons: string[] = [];
    
    // 1. Skills Match (35%)
    const candSkillsLower = candidate.skills.map(s => s.toLowerCase().trim());
    const matchedSkills = reqSkillsLower.filter(s => candSkillsLower.includes(s));
    
    if (reqSkillsLower.length > 0) {
      const skillsScore = (matchedSkills.length / reqSkillsLower.length) * 35;
      score += skillsScore;
      if (matchedSkills.length > 0) {
        reasons.push(`Matches ${matchedSkills.length}/${requiredSkills.length} skills: ${matchedSkills.join(', ')}`);
      }
    } else {
      score += 35; // If no skills required, full marks
    }

    // 2. Roles Match (25%)
    const candRolesLower = candidate.roles.map(r => r.toLowerCase().trim());
    const matchedRoles = reqRolesLower.filter(r => candRolesLower.includes(r));
    
    if (reqRolesLower.length > 0) {
      if (matchedRoles.length > 0) {
        score += 25;
        reasons.push(`Matches role: ${matchedRoles.join(', ')}`);
      }
    } else {
      score += 25;
    }

    // 3. Repository Analysis (20%)
    let matchingReposCount = 0;
    if (candidate.repositories && candidate.repositories.length > 0) {
      for (const repo of candidate.repositories) {
        const repoLangLower = repo.language ? repo.language.toLowerCase().trim() : '';
        const repoNameLower = repo.name.toLowerCase();
        const repoDescLower = repo.description ? repo.description.toLowerCase() : '';
        
        // Check if repo language matches any required skills
        const langMatches = reqSkillsLower.includes(repoLangLower);
        // Check if repo name or desc matches required skills
        const descMatches = reqSkillsLower.some(skill => 
          repoNameLower.includes(skill) || repoDescLower.includes(skill)
        );
        
        if (langMatches || descMatches) {
          matchingReposCount++;
        }
      }
      
      const repoRatio = Math.min(matchingReposCount / 3, 1); // Cap at 3 repos for max points
      const repoScore = repoRatio * 20;
      score += repoScore;
      if (matchingReposCount > 0) {
        reasons.push(`Has ${matchingReposCount} public repos aligned with skills`);
      }
    }

    // 4. Availability Status (10%)
    if (candidate.status === 'Looking for Team') {
      score += 10;
      reasons.push('Actively looking for a team!');
    } else if (candidate.status === 'Available') {
      score += 7;
      reasons.push('Status: Available');
    } else if (candidate.status === 'Looking for Projects') {
      score += 5;
      reasons.push('Looking for projects to join');
    } else if (candidate.status === 'Busy') {
      score += 0;
    }

    // 5. Trust / Review Score (10%)
    if (candidate.trustScore > 0) {
      const ratingScore = (candidate.trustScore / 5) * 10;
      score += ratingScore;
      if (candidate.trustScore >= 4.0) {
        reasons.push(`High Trust Score: ${candidate.trustScore.toFixed(1)}/5.0`);
      }
    } else {
      score += 8; // Default neutral score
      reasons.push('New teammate (clean record)');
    }

    const finalScore = Math.min(Math.round(score), 100);

    results.push({
      candidate,
      matchScore: finalScore,
      reasons,
    });
  }

  // Sort candidates by match score descending
  return results.sort((a, b) => b.matchScore - a.matchScore);
}
