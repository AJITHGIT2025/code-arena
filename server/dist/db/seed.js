"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const prisma_1 = __importDefault(require("./prisma"));
async function seed() {
    console.log('Seeding CODE ARENA database...');
    // 1. Seed Admin User
    const adminPasswordHash = await bcryptjs_1.default.hash('Admin@CodeArena2026!', 10);
    const admin = await prisma_1.default.user.upsert({
        where: { email: 'admin@codearena.com' },
        update: {},
        create: {
            name: 'System Administrator',
            email: 'admin@codearena.com',
            passwordHash: adminPasswordHash,
            role: 'ADMIN',
            academicYear: 'General',
        },
    });
    console.log(`[Admin] ${admin.email} ready.`);
    // 2. Seed Demo Student
    const studentPasswordHash = await bcryptjs_1.default.hash('Student@123', 10);
    const student = await prisma_1.default.user.upsert({
        where: { email: 'student@codearena.com' },
        update: {},
        create: {
            name: 'Alex Johnson',
            email: 'student@codearena.com',
            passwordHash: studentPasswordHash,
            role: 'STUDENT',
            academicYear: '1st Year',
        },
    });
    console.log(`[Student] ${student.email} ready.`);
    // 3. Demo Question 1 (1st Year): Sum of Two Numbers
    const q1 = await prisma_1.default.problem.upsert({
        where: { problemCode: 'SUM-001' },
        update: {},
        create: {
            problemCode: 'SUM-001',
            title: 'Sum of Two Numbers',
            description: `Write a program that accepts two integers from standard input and prints their sum to standard output.

This problem is designed to test standard input and standard output handling in your chosen programming language.`,
            academicYear: '1st Year',
            topic: 'Basic Fundamentals',
            difficulty: 'Easy',
            points: 100,
            inputFormat: 'A single line containing two space-separated integers A and B.',
            outputFormat: 'Print a single integer representing the sum of A and B.',
            constraints: '-10^9 <= A, B <= 10^9',
            timeLimit: 2.0,
            memoryLimit: 256,
            isPublished: true,
            starterCodeC: `#include <stdio.h>

int main() {
    int a, b;
    if (scanf("%d %d", &a, &b) == 2) {
        printf("%d\\n", a + b);
    }
    return 0;
}`,
            starterCodeCpp: `#include <iostream>
using namespace std;

int main() {
    long long a, b;
    if (cin >> a >> b) {
        cout << (a + b) << endl;
    }
    return 0;
}`,
            starterCodeJava: `import java.util.Scanner;

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        if (sc.hasNextLong()) {
            long a = sc.nextLong();
            long b = sc.nextLong();
            System.out.println(a + b);
        }
        sc.close();
    }
}`,
            starterCodePython: `import sys

def main():
    input_data = sys.stdin.read().split()
    if len(input_data) >= 2:
        a = int(input_data[0])
        b = int(input_data[1])
        print(a + b)

if __name__ == '__main__':
    main()`,
            sampleTestCases: {
                create: [
                    {
                        inputData: '5 7',
                        expectedOutput: '12',
                        explanation: '5 + 7 = 12',
                        displayOrder: 1,
                    },
                    {
                        inputData: '-3 8',
                        expectedOutput: '5',
                        explanation: '(-3) + 8 = 5',
                        displayOrder: 2,
                    },
                ],
            },
            hiddenTestCases: {
                create: [
                    { inputData: '10 20', expectedOutput: '30', pointsOrWeight: 25 },
                    { inputData: '-5 15', expectedOutput: '10', pointsOrWeight: 25 },
                    { inputData: '1000 2000', expectedOutput: '3000', pointsOrWeight: 25 },
                    { inputData: '0 0', expectedOutput: '0', pointsOrWeight: 25 },
                ],
            },
        },
    });
    console.log(`[Problem] ${q1.problemCode} seeded.`);
    // 4. Demo Question 2 (2nd Year): Reverse an Array
    const q2 = await prisma_1.default.problem.upsert({
        where: { problemCode: 'ARR-002' },
        update: {},
        create: {
            problemCode: 'ARR-002',
            title: 'Reverse an Array',
            description: `Given an array of N integers, print the elements in reverse order separated by spaces.`,
            academicYear: '2nd Year',
            topic: 'Arrays & Pointers',
            difficulty: 'Medium',
            points: 120,
            inputFormat: `The first line contains an integer N representing the number of elements.
The second line contains N space-separated integers.`,
            outputFormat: 'Print the elements in reverse order on a single line, separated by a space.',
            constraints: `1 <= N <= 10^5
-10^9 <= A[i] <= 10^9`,
            timeLimit: 2.0,
            memoryLimit: 256,
            isPublished: true,
            starterCodeC: `#include <stdio.h>
#include <stdlib.h>

int main() {
    int n;
    if (scanf("%d", &n) != 1) return 0;
    int *arr = (int*)malloc(n * sizeof(int));
    for (int i = 0; i < n; i++) {
        scanf("%d", &arr[i]);
    }
    for (int i = n - 1; i >= 0; i--) {
        printf("%d%c", arr[i], (i == 0 ? '\\n' : ' '));
    }
    free(arr);
    return 0;
}`,
            starterCodeCpp: `#include <iostream>
#include <vector>
using namespace std;

int main() {
    ios_base::sync_with_stdio(false);
    cin.tie(NULL);
    int n;
    if (!(cin >> n)) return 0;
    vector<int> a(n);
    for (int i = 0; i < n; i++) cin >> a[i];
    for (int i = n - 1; i >= 0; i--) {
        cout << a[i] << (i == 0 ? "" : " ");
    }
    cout << "\\n";
    return 0;
}`,
            starterCodeJava: `import java.util.Scanner;

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        if (!sc.hasNextInt()) return;
        int n = sc.nextInt();
        int[] arr = new int[n];
        for (int i = 0; i < n; i++) {
            arr[i] = sc.nextInt();
        }
        StringBuilder sb = new StringBuilder();
        for (int i = n - 1; i >= 0; i--) {
            sb.append(arr[i]);
            if (i > 0) sb.append(" ");
        }
        System.out.println(sb.toString());
        sc.close();
    }
}`,
            starterCodePython: `import sys

def main():
    lines = sys.stdin.read().split()
    if not lines:
        return
    n = int(lines[0])
    arr = lines[1:1+n]
    print(" ".join(reversed(arr)))

if __name__ == '__main__':
    main()`,
            sampleTestCases: {
                create: [
                    {
                        inputData: '5\n1 2 3 4 5',
                        expectedOutput: '5 4 3 2 1',
                        explanation: 'Reversing [1, 2, 3, 4, 5] yields [5, 4, 3, 2, 1]',
                        displayOrder: 1,
                    },
                ],
            },
            hiddenTestCases: {
                create: [
                    { inputData: '1\n42', expectedOutput: '42', pointsOrWeight: 30 },
                    { inputData: '4\n10 20 30 40', expectedOutput: '40 30 20 10', pointsOrWeight: 30 },
                    { inputData: '6\n-1 5 -10 20 0 7', expectedOutput: '7 0 20 -10 5 -1', pointsOrWeight: 30 },
                    { inputData: '3\n999 888 777', expectedOutput: '777 888 999', pointsOrWeight: 30 },
                ],
            },
        },
    });
    console.log(`[Problem] ${q2.problemCode} seeded.`);
    // 5. Demo Question 3 (3rd Year): Maximum Subarray Sum (Kadane's Algorithm)
    const q3 = await prisma_1.default.problem.upsert({
        where: { problemCode: 'DP-003' },
        update: {},
        create: {
            problemCode: 'DP-003',
            title: 'Maximum Subarray Sum',
            description: `Given an integer array nums, find the contiguous subarray (containing at least one number) which has the largest sum and output its sum.

This is the classic Kadane's Algorithm problem.`,
            academicYear: '3rd Year',
            topic: 'Dynamic Programming',
            difficulty: 'Hard',
            points: 150,
            inputFormat: `The first line contains an integer N representing the size of the array.
The second line contains N space-separated integers.`,
            outputFormat: 'Print a single integer representing the maximum subarray sum.',
            constraints: `1 <= N <= 10^5
-10^4 <= nums[i] <= 10^4`,
            timeLimit: 2.0,
            memoryLimit: 256,
            isPublished: true,
            starterCodeC: `#include <stdio.h>

int main() {
    int n;
    if (scanf("%d", &n) != 1) return 0;
    long long max_so_far, current_max, val;
    scanf("%lld", &val);
    max_so_far = val;
    current_max = val;
    for (int i = 1; i < n; i++) {
        scanf("%lld", &val);
        current_max = (val > current_max + val) ? val : (current_max + val);
        if (current_max > max_so_far) max_so_far = current_max;
    }
    printf("%lld\\n", max_so_far);
    return 0;
}`,
            starterCodeCpp: `#include <iostream>
#include <vector>
#include <algorithm>
using namespace std;

int main() {
    ios_base::sync_with_stdio(false);
    cin.tie(NULL);
    int n;
    if (!(cin >> n)) return 0;
    long long val;
    cin >> val;
    long long max_so_far = val;
    long long current_max = val;
    for (int i = 1; i < n; i++) {
        cin >> val;
        current_max = max(val, current_max + val);
        max_so_far = max(max_so_far, current_max);
    }
    cout << max_so_far << "\\n";
    return 0;
}`,
            starterCodeJava: `import java.util.Scanner;

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        if (!sc.hasNextInt()) return;
        int n = sc.nextInt();
        long currentMax = sc.nextLong();
        long maxSoFar = currentMax;
        for (int i = 1; i < n; i++) {
            long val = sc.nextLong();
            currentMax = Math.max(val, currentMax + val);
            maxSoFar = Math.max(maxSoFar, currentMax);
        }
        System.out.println(maxSoFar);
        sc.close();
    }
}`,
            starterCodePython: `import sys

def main():
    data = sys.stdin.read().split()
    if not data:
        return
    n = int(data[0])
    nums = [int(x) for x in data[1:1+n]]
    max_so_far = nums[0]
    current_max = nums[0]
    for x in nums[1:]:
        current_max = max(x, current_max + x)
        max_so_far = max(max_so_far, current_max)
    print(max_so_far)

if __name__ == '__main__':
    main()`,
            sampleTestCases: {
                create: [
                    {
                        inputData: '8\n-2 1 -3 4 -1 2 1 -5 4',
                        expectedOutput: '6',
                        explanation: 'The contiguous subarray [4, -1, 2, 1] has the largest sum = 6.',
                        displayOrder: 1,
                    },
                ],
            },
            hiddenTestCases: {
                create: [
                    { inputData: '5\n1 2 3 4 5', expectedOutput: '15', pointsOrWeight: 35 },
                    { inputData: '4\n-1 -2 -3 -4', expectedOutput: '-1', pointsOrWeight: 35 },
                    { inputData: '1\n10', expectedOutput: '10', pointsOrWeight: 40 },
                    { inputData: '5\n5 4 -1 7 8', expectedOutput: '23', pointsOrWeight: 40 },
                ],
            },
        },
    });
    console.log(`[Problem] ${q3.problemCode} seeded.`);
    console.log('Database seeding completed successfully!');
}
seed()
    .catch((e) => {
    console.error('Seeding error:', e);
    process.exit(1);
})
    .finally(async () => {
    await prisma_1.default.$disconnect();
});
