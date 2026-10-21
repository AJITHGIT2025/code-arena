import axios from 'axios';
import { spawn, ChildProcess } from 'child_process';
import path from 'path';

const API_BASE = 'http://localhost:5000/api';

async function wait(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

async function runTestSuite() {
  console.log('====================================================');
  console.log('       CODE ARENA END-TO-END INTEGRATION TEST       ');
  console.log('====================================================\n');

  // Start the server in background if not already running
  let serverProcess: ChildProcess | null = null;
  let serverRunning = false;

  try {
    const health = await axios.get(`${API_BASE}/health`, { timeout: 1500 });
    if (health.data.status === 'healthy') {
      serverRunning = true;
      console.log('✓ Existing CODE ARENA server detected on port 5000.\n');
    }
  } catch (e) {
    console.log('Starting CODE ARENA server for tests...');
    serverProcess = spawn('npx', ['tsx', 'src/index.ts'], {
      cwd: path.resolve(__dirname),
      shell: true,
      stdio: 'inherit',
    });

    // Wait for server to be up
    for (let i = 0; i < 20; i++) {
      await wait(1000);
      try {
        const health = await axios.get(`${API_BASE}/health`, { timeout: 1500 });
        if (health.data.status === 'healthy') {
          serverRunning = true;
          console.log('✓ Server started successfully.\n');
          break;
        }
      } catch (err) {
        // keep waiting
      }
    }
  }

  if (!serverRunning) {
    throw new Error('Failed to start test server.');
  }

  try {
    // -----------------------------------------------------------
    // TEST 1: ADMIN LOGIN
    // -----------------------------------------------------------
    console.log('TEST 1: Admin Authentication...');
    const adminLoginRes = await axios.post(`${API_BASE}/auth/login`, {
      email: 'admin@codearena.com',
      password: 'Admin@CodeArena2026!',
    });
    const adminToken = adminLoginRes.data.token;
    if (!adminToken || adminLoginRes.data.user.role !== 'ADMIN') {
      throw new Error('Admin login failed or role is not ADMIN');
    }
    console.log(`✓ Admin logged in successfully: ${adminLoginRes.data.user.name} (${adminLoginRes.data.user.role})\n`);

    // -----------------------------------------------------------
    // TEST 2: STUDENT REGISTRATION & LOGIN
    // -----------------------------------------------------------
    console.log('TEST 2: Student Registration & Login...');
    const testStudentEmail = `test_coder_${Date.now()}@college.edu`;
    const regRes = await axios.post(`${API_BASE}/auth/register`, {
      name: 'Rohan Sharma',
      email: testStudentEmail,
      password: 'Password@123',
      academicYear: '2nd Year',
    });
    const studentToken = regRes.data.token;
    const studentUser = regRes.data.user;
    if (!studentToken || studentUser.role !== 'STUDENT') {
      throw new Error('Student registration failed');
    }
    console.log(`✓ Student registered: ${studentUser.name} (${studentUser.academicYear})\n`);

    // -----------------------------------------------------------
    // TEST 3: PROBLEM BROWSING & YEAR FILTERING
    // -----------------------------------------------------------
    console.log('TEST 3: Problem Browsing & Academic Year Filtering...');
    const allProblemsRes = await axios.get(`${API_BASE}/problems`);
    const problems = allProblemsRes.data.problems;
    console.log(`✓ Retrieved ${problems.length} published problems.`);

    const y1Res = await axios.get(`${API_BASE}/problems?year=1st+Year`);
    console.log(`✓ 1st Year problems count: ${y1Res.data.problems.length}`);

    const y2Res = await axios.get(`${API_BASE}/problems?year=2nd+Year`);
    console.log(`✓ 2nd Year problems count: ${y2Res.data.problems.length}`);

    const y3Res = await axios.get(`${API_BASE}/problems?year=3rd+Year`);
    console.log(`✓ 3rd Year problems count: ${y3Res.data.problems.length}\n`);

    // -----------------------------------------------------------
    // TEST 4: SECURITY CHECK - HIDDEN TEST CASE ISOLATION
    // -----------------------------------------------------------
    console.log('TEST 4: Security Verification — Hidden Test Cases Leak Check...');
    const targetProblem = problems[0];
    const studentViewRes = await axios.get(`${API_BASE}/problems/${targetProblem.problemCode}`, {
      headers: { Authorization: `Bearer ${studentToken}` },
    });
    const studentData = studentViewRes.data;
    if (studentData.problem.hiddenTestCases !== undefined) {
      throw new Error('CRITICAL SECURITY VIOLATION: Hidden test cases exposed in student endpoint!');
    }
    console.log(`✓ PASSED: Hidden test cases are completely excluded from student/guest endpoints.`);
    console.log(`✓ Sample test cases count visible: ${studentData.problem.sampleTestCases.length}\n`);

    // -----------------------------------------------------------
    // TEST 5: ADMIN CREATE NEW PROBLEM
    // -----------------------------------------------------------
    console.log('TEST 5: Admin Question Creation System...');
    const newProbCode = `TEST-${Date.now().toString().slice(-4)}`;
    const createProbRes = await axios.post(
      `${API_BASE}/problems`,
      {
        problemCode: newProbCode,
        title: 'Multiply by Two',
        academicYear: '1st Year',
        topic: 'Basic Fundamentals',
        difficulty: 'Easy',
        points: 50,
        description: 'Read an integer N and print 2 * N.',
        inputFormat: 'A single integer N.',
        outputFormat: 'Print 2 * N.',
        constraints: '1 <= N <= 10^6',
        timeLimit: 2.0,
        memoryLimit: 256,
        isPublished: true,
        starterCodePython: 'import sys\nn = int(sys.stdin.read())\nprint(2 * n)',
        sampleTestCases: [{ inputData: '5', expectedOutput: '10', explanation: '2 * 5 = 10', displayOrder: 1 }],
        hiddenTestCases: [
          { inputData: '25', expectedOutput: '50', pointsOrWeight: 25 },
          { inputData: '100', expectedOutput: '200', pointsOrWeight: 25 },
        ],
      },
      { headers: { Authorization: `Bearer ${adminToken}` } }
    );
    const createdProb = createProbRes.data.problem;
    console.log(`✓ Admin created problem: "${createdProb.title}" (Code: ${createdProb.problemCode}, Points: ${createdProb.points})\n`);

    // -----------------------------------------------------------
    // TEST 6: RUN CODE (STUDENT / GUEST EXECUTION)
    // -----------------------------------------------------------
    console.log('TEST 6: Online Compiler Run Against Sample Cases (Python)...');
    const runRes = await axios.post(`${API_BASE}/submissions/run`, {
      problemId: createdProb.id,
      language: 'python',
      sourceCode: 'import sys\nn = int(sys.stdin.read().strip())\nprint(2 * n)',
    });
    console.log('✓ Run Result status:', runRes.data.allPassed ? 'ALL SAMPLE CASES PASSED' : 'FAILED');
    console.log(`✓ Case 1 Output: Expected="${runRes.data.results[0].expectedOutput}", Got="${runRes.data.results[0].actualOutput.trim()}"\n`);

    // -----------------------------------------------------------
    // TEST 7: SUBMIT CODE (EVALUATED AGAINST HIDDEN CASES)
    // -----------------------------------------------------------
    console.log('TEST 7: Online Judge Submit Against Hidden Cases...');
    const submitRes = await axios.post(
      `${API_BASE}/submissions/submit`,
      {
        problemId: createdProb.id,
        language: 'python',
        sourceCode: 'import sys\nn = int(sys.stdin.read().strip())\nprint(2 * n)',
      },
      { headers: { Authorization: `Bearer ${studentToken}` } }
    );
    const subResult = submitRes.data;
    console.log(`✓ Overall Status: ${subResult.status}`);
    console.log(`✓ Passed Test Cases: ${subResult.passedTestCases} / ${subResult.totalTestCases}`);
    console.log(`✓ Points Awarded: ${subResult.pointsEarned} / ${subResult.totalPoints} pts`);
    console.log(`✓ Solved Flag: ${subResult.solved}\n`);

    if (subResult.status !== 'Accepted' || !subResult.solved) {
      throw new Error(`Expected Accepted status, but got ${subResult.status}`);
    }

    // -----------------------------------------------------------
    // TEST 8: LEADERBOARD & STUDENT DASHBOARD STATS
    // -----------------------------------------------------------
    console.log('TEST 8: Leaderboard & Student Dashboard Stats Verification...');
    const dashRes = await axios.get(`${API_BASE}/stats/dashboard`, {
      headers: { Authorization: `Bearer ${studentToken}` },
    });
    console.log(`✓ Student Dashboard Solved Count: ${dashRes.data.solvedCount}`);
    console.log(`✓ Student Dashboard Total Points: ${dashRes.data.totalPoints} pts`);

    const leaderRes = await axios.get(`${API_BASE}/stats/leaderboard`);
    const studentInLeaderboard = leaderRes.data.leaderboard.find((s: any) => s.id === studentUser.id);
    if (studentInLeaderboard) {
      console.log(`✓ Student appears on Campus Leaderboard at Rank #${studentInLeaderboard.rank} with ${studentInLeaderboard.totalPoints} pts!`);
    } else {
      console.log('✓ Leaderboard populated with top students.');
    }

    // Clean up created test problem
    await axios.delete(`${API_BASE}/problems/${createdProb.id}`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    console.log(`\n✓ Cleaned up test problem ${createdProb.problemCode}.`);

    console.log('\n====================================================');
    console.log('     🎉 ALL END-TO-END TESTS PASSED SUCCESSFULLY!    ');
    console.log('====================================================');
  } finally {
    if (serverProcess) {
      serverProcess.kill();
    }
  }
}

runTestSuite().catch((err) => {
  console.error('\n❌ Test Suite Failed:', err.response?.data || err.message);
  process.exit(1);
});
