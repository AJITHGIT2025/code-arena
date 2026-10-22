"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const prisma_1 = __importDefault(require("./prisma"));
async function seedIEEE() {
    console.log('Seeding IEEE CIS — MIND MATRIX Coding Questions...');
    const filePath = path_1.default.resolve(__dirname, '../../../ieee-mind-matrix-questions.json');
    if (!fs_1.default.existsSync(filePath)) {
        console.error('Questions file not found at:', filePath);
        return;
    }
    const questions = JSON.parse(fs_1.default.readFileSync(filePath, 'utf-8'));
    for (const q of questions) {
        const existing = await prisma_1.default.problem.findUnique({
            where: { problemCode: q.problemCode },
        });
        if (existing) {
            console.log(`[Skipping] ${q.problemCode} already exists.`);
            continue;
        }
        const created = await prisma_1.default.problem.create({
            data: {
                problemCode: q.problemCode,
                title: q.title,
                description: q.description,
                academicYear: q.academicYear,
                topic: q.topic,
                difficulty: q.difficulty,
                points: q.points,
                inputFormat: q.inputFormat,
                outputFormat: q.outputFormat,
                constraints: q.constraints,
                timeLimit: q.timeLimit,
                memoryLimit: q.memoryLimit,
                isPublished: q.isPublished,
                starterCodeC: q.starterCodeC,
                starterCodeCpp: q.starterCodeCpp,
                starterCodeJava: q.starterCodeJava,
                starterCodePython: q.starterCodePython,
                sampleTestCases: {
                    create: q.sampleTestCases.map((s) => ({
                        inputData: s.inputData,
                        expectedOutput: s.expectedOutput,
                        explanation: s.explanation,
                        displayOrder: s.displayOrder,
                    })),
                },
                hiddenTestCases: {
                    create: q.hiddenTestCases.map((h) => ({
                        inputData: h.inputData,
                        expectedOutput: h.expectedOutput,
                        pointsOrWeight: h.pointsOrWeight,
                    })),
                },
            },
        });
        console.log(`[Added Problem] ${created.problemCode}: ${created.title} (${created.academicYear})`);
    }
    console.log('Finished seeding IEEE CIS Mind Matrix questions!');
}
seedIEEE()
    .catch((e) => {
    console.error(e);
    process.exit(1);
})
    .finally(async () => {
    await prisma_1.default.$disconnect();
});
