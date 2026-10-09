import { NextResponse } from 'next/server';
import { db } from '../../../../lib/firebase';
import { doc, getDoc, setDoc, serverTimestamp, collection, addDoc } from 'firebase/firestore';

export async function POST(req: Request) {
  try {
    const { sessionId, isFlagged } = await req.json();

    // In a real system, we'd kick off a background worker.
    // For this simulation, we'll process it synchronously (or with a small delay)
    // but the client isn't waiting for the response to render the completion screen.
    
    // Simulate LLM delay
    await new Promise(resolve => setTimeout(resolve, 5000));

    const snap = await getDoc(doc(db, 'mockInterviews', sessionId));
    if (!snap.exists()) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    const session = snap.data();
    const questions = session.questions || [];

    let totalScore = 0;
    const perQuestionScores = questions.map((q: any) => {
      // Dummy scoring logic
      const score = Math.floor(Math.random() * 5) + 5; // 5 to 9
      totalScore += score;
      return {
        questionId: q.id,
        score,
        feedback: q.id.startsWith('cq_') 
          ? 'Code compiles and runs, but could be optimized for time complexity.'
          : 'Good answer, but missed some key concepts like scalability.'
      };
    });

    const overallScore = Math.round(totalScore / questions.length);

    const report = {
      sessionId,
      overallScore,
      perQuestionScores,
      strengths: ['Problem Solving', 'Clear Communication'],
      gaps: ['Advanced Data Structures', 'System Design Trade-offs'],
      suggestedResources: ['Cracking the Coding Interview', 'System Design Primer'],
      generatedAt: serverTimestamp(),
      status: isFlagged ? 'under_review' : 'ready'
    };

    // Save report
    const reportRef = await addDoc(collection(db, 'performanceReports'), report);

    // If not flagged, update the mock interview status to completed and link report
    if (!isFlagged) {
      await setDoc(doc(db, 'mockInterviews', sessionId), {
        status: 'completed',
        reportId: reportRef.id
      }, { merge: true });
    }

    return NextResponse.json({ success: true, reportId: reportRef.id });
  } catch (error: any) {
    console.error('Error generating score:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
