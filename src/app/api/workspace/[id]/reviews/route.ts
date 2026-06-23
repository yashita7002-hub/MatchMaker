import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Project from '@/models/Project';
import Review from '@/models/Review';
import User from '@/models/User';
import { getSessionUser } from '@/lib/auth';

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await connectDB();
    const user = await getSessionUser(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const { id } = await params;
    const project = await Project.findById(id);
    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }
    
    if (project.status !== 'Completed') {
      return NextResponse.json({ error: 'Reviews can only be submitted for completed projects' }, { status: 400 });
    }
    
    
    const isReviewerMember = project.members.some(m => m.toString() === user._id.toString());
    if (!isReviewerMember) {
      return NextResponse.json({ error: 'Forbidden. You are not a member of this project.' }, { status: 403 });
    }
    
    const { revieweeId, communication, technicalSkills, reliability, teamwork, comment } = await req.json();
    if (!revieweeId || !communication || !technicalSkills || !reliability || !teamwork) {
      return NextResponse.json({ error: 'Missing rating values' }, { status: 400 });
    }
    
    
    const isRevieweeMember = project.members.some(m => m.toString() === revieweeId.toString());
    if (!isRevieweeMember) {
      return NextResponse.json({ error: 'Reviewee is not a member of this project' }, { status: 400 });
    }
    
    if (user._id.toString() === revieweeId.toString()) {
      return NextResponse.json({ error: 'You cannot rate yourself' }, { status: 400 });
    }
    
    
    const existingReview = await Review.findOne({
      projectId: project._id,
      reviewerId: user._id,
      revieweeId,
    });
    if (existingReview) {
      return NextResponse.json({ error: 'You have already submitted a review for this teammate' }, { status: 400 });
    }
    
    
    const review = await Review.create({
      projectId: project._id,
      reviewerId: user._id,
      revieweeId,
      communication: Number(communication),
      technicalSkills: Number(technicalSkills),
      reliability: Number(reliability),
      teamwork: Number(teamwork),
      comment: comment || '',
    });
    
    
    const reviewee = await User.findById(revieweeId);
    if (reviewee) {
      reviewee.ratingsSum.communication = (reviewee.ratingsSum.communication || 0) + Number(communication);
      reviewee.ratingsSum.technicalSkills = (reviewee.ratingsSum.technicalSkills || 0) + Number(technicalSkills);
      reviewee.ratingsSum.reliability = (reviewee.ratingsSum.reliability || 0) + Number(reliability);
      reviewee.ratingsSum.teamwork = (reviewee.ratingsSum.teamwork || 0) + Number(teamwork);
      reviewee.reviewsCount = (reviewee.reviewsCount || 0) + 1;
      
      const totalScoreSum = reviewee.ratingsSum.communication +
                           reviewee.ratingsSum.technicalSkills +
                           reviewee.ratingsSum.reliability +
                           reviewee.ratingsSum.teamwork;
                           
      reviewee.trustScore = Number((totalScoreSum / (4 * reviewee.reviewsCount)).toFixed(2));
      
      await reviewee.save();
    }
    
    return NextResponse.json({ success: true, review });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
