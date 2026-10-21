import { judgeService } from './src/services/judgeService';

async function testJudge() {
  console.log('Testing Judge Execution Engine...');

  // Test Python
  console.log('1. Testing Python:');
  const pyRes = await judgeService.execute('python', 'import sys; print("Python Output:", 5 + 7)', '');
  console.log('   Status:', pyRes.status.description, '| Stdout:', pyRes.stdout?.trim());

  // Test C
  console.log('2. Testing C:');
  const cRes = await judgeService.execute(
    'c',
    '#include <stdio.h>\nint main(){ int a, b; if(scanf("%d %d", &a, &b)==2) printf("%d\\n", a*b); return 0; }',
    '6 7'
  );
  console.log('   Status:', cRes.status.description, '| Stdout:', cRes.stdout?.trim());

  // Test C++
  console.log('3. Testing C++:');
  const cppRes = await judgeService.execute(
    'cpp',
    '#include <iostream>\nusing namespace std;\nint main(){ cout << "Hello C++!" << endl; return 0; }',
    ''
  );
  console.log('   Status:', cppRes.status.description, '| Stdout:', cppRes.stdout?.trim());

  // Test Java
  console.log('4. Testing Java:');
  const javaRes = await judgeService.execute(
    'java',
    'public class Main { public static void main(String[] args) { System.out.println("Java Running!"); } }',
    ''
  );
  console.log('   Status:', javaRes.status.description, '| Stdout:', javaRes.stdout?.trim());

  console.log('Judge test finished successfully!');
}

testJudge().catch(console.error);
