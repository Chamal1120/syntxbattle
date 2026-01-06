/**
 * Syntxbattle - Test runner
 *
 * @author Chamal Mallwaarachchi
 */
import { json } from '@sveltejs/kit';
import { spawn } from 'child_process';
import { writeFile, unlink, mkdir } from 'fs/promises';
import { randomUUID } from 'crypto';
import { existsSync } from 'fs';
import type { RequestHandler } from './$types';

interface SubmissionRequest {
    code: string;
    language: 'javascript' | 'typescript';
}

export const POST: RequestHandler = async ({ request, params, locals }) => {
    const { matchId } = params;
    const session = await locals.safeGetSession();

    if (!session?.user) {
        return json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;

    // Use server-side Supabase client from locals
    const supabase = locals.supabase;

    try {
        const { code, language }: SubmissionRequest = await request.json();

        // Get match and problem data with language config
        const { data: match, error: matchError } = await supabase
            .from('matches')
            .select('*, problems(*)')
            .eq('id', matchId)
            .single();

        if (matchError || !match) {
            return json({ error: 'Match not found' }, { status: 404 });
        }

        // Get language-specific metadata
        const { data: problemLang, error: langError } = await supabase
            .from('problem_languages')
            .select('*')
            .eq('problem_id', match.problem_id)
            .eq('language', language)
            .single();

        if (langError || !problemLang) {
            return json(
                { error: `Language '${language}' not supported for this problem` },
                { status: 404 }
            );
        }

        // Get test cases (stored in problems table as JSONB)
        const testCases = match.problems.test_cases;

        // Run test cases
        const results = await runTests(code, language, testCases, problemLang.function_name);
        const allPassed = results.every((r) => r.passed);
        const passedCount = results.filter((r) => r.passed).length;

        // Calculate completion time if all tests passed
        let completionData = {};
        if (allPassed) {
            console.log('All tests passed, calculating completion time...');
            console.log('Match created_at:', match.created_at);

            const { data: participant, error: participantError } = await supabase
                .from('match_participants')
                .select('*')
                .eq('match_id', matchId)
                .eq('user_id', userId)
                .single();

            console.log('Participant data:', participant);
            console.log('Participant error:', participantError);

            if (participant && match.created_at) {
                const finishedAt = new Date();
                const startTime = new Date(match.created_at);
                const completionTimeMs = finishedAt.getTime() - startTime.getTime();

                completionData = {
                    status: 'finished',
                    finished_at: finishedAt.toISOString(),
                    completion_time_ms: completionTimeMs,
                };

                console.log('Completion data:', completionData);

                // Update participant status
                const { error: updateError } = await supabase
                    .from('match_participants')
                    .update(completionData)
                    .eq('match_id', matchId)
                    .eq('user_id', userId);

                console.log('Update error:', updateError);
            } 
        }

        return json({
            success: allPassed,
            passed: passedCount,
            total: testCases.length,
            results,
            ...completionData,
        });
    } catch (error: any) {
        console.error('Submission error:', error);
        return json({ error: error.message }, { status: 500 });
    }
};

async function runTests(
    code: string,
    language: 'javascript' | 'typescript',
    testCases: Array<{ args: any[]; expected: any }>,
    functionName: string
): Promise<
    Array<{ passed: boolean; input: string; expected: string; actual: string; error?: string }>
> {
    const results = [];

    for (const testCase of testCases) {
        try {
            const result = await executeCode(code, language, testCase.args, functionName);
            const passed = JSON.stringify(result) === JSON.stringify(testCase.expected);

            results.push({
                passed,
                input: JSON.stringify(testCase.args),
                expected: JSON.stringify(testCase.expected),
                actual: JSON.stringify(result),
            });
        } catch (error: any) {
            results.push({
                passed: false,
                input: JSON.stringify(testCase.args),
                expected: JSON.stringify(testCase.expected),
                actual: '',
                error: error.message,
            });
        }
    }

    return results;
}

async function executeCode(
    code: string,
    language: 'javascript' | 'typescript',
    args: any[],
    functionName: string
): Promise<any> {
    const tempDir = '/tmp/syntxbattle';
    const tempId = randomUUID();
    const ext = language === 'typescript' ? 'ts' : 'js';
    const tempFile = `${tempDir}/${tempId}.${ext}`;

    if (!existsSync(tempDir)) {
        await mkdir(tempDir, { recursive: true });
    }

    // Wrap user code with test harness
    const wrappedCode = `
${code}

// Test harness
const result = ${functionName}(${args.map((arg) => JSON.stringify(arg)).join(', ')});
console.log(JSON.stringify(result));
`;

    await writeFile(tempFile, wrappedCode);

    return new Promise((resolve, reject) => {
        const executor =
            language === 'typescript'
                ? spawn('node', ['node_modules/.bin/tsx', tempFile])
                : spawn('node', [tempFile]);

        let output = '';
        let errorOutput = '';

        executor.stdout.on('data', (data) => {
            output += data.toString();
        });

        executor.stderr.on('data', (data) => {
            errorOutput += data.toString();
        });

        const timeout = setTimeout(() => {
            executor.kill();
            reject(new Error('Execution timeout (5s)'));
        }, 5000);

        executor.on('close', async (code) => {
            clearTimeout(timeout);

            // Cleanup temp file
            try {
                await unlink(tempFile);
            } catch (e) {}

            if (code !== 0) {
                reject(new Error(errorOutput || `Process exited with code ${code}`));
            } else {
                try {
                    const result = JSON.parse(output.trim());
                    resolve(result);
                } catch (e) {
                    reject(new Error(`Invalid output: ${output}`));
                }
            }
        });

        executor.on('error', async (err) => {
            clearTimeout(timeout);

            try {
                await unlink(tempFile);
            } catch (e) {}

            reject(err);
        });
    });
}
