#!/env/node

const { Command } = require('commander');
const { chromium } = require('playwright');

let endCurrentTest = false;
const sleep = ms => new Promise(res => setTimeout(res, ms));

async function runTest(testName, args) {
    args.delay = args.delay === undefined ? undefined : parseFloat(args.delay);

    const browser = await chromium.launch({ headless: false });
    const page = await browser.newPage();

    process.stdin.setEncoding('utf8');
    process.stdin.on('data', handleInput);

    console.log("Type 'q' + <Enter> to quit the benchmark. Type it again to quit the program.");

    try {
        const testRunner = testRunners[testName];
        if (testRunner) {
            await testRunner[0](page, args);
        } else {
            console.error('Invalid test name provided.');
        }
    } catch (error) {
        console.error('An error occurred:', error);
    } finally {
        console.log("Benchmark Completed. Press 'q' + <Enter> to quit.")
        endCurrentTest = true;
    }
}

async function handleInput(chunk) {
    const input = chunk.trim().toLowerCase();
    if (input === 'q') {
        if (endCurrentTest) {
            process.exit();
        } else {
            endCurrentTest = true;
            console.log('Please wait for current benchmark loop to end... press \'q\' + <Enter> to force quit');
        }
    } else {
        console.log('Unknown Input:', input);
    }
}

async function runReactionTimeTest(page, args) {
    console.log('Running reaction time test...');
    await page.goto('https://humanbenchmark.com/tests/reactiontime');
    const test = page.locator('[data-test="true"]');
    await click(page, test);
    await page.locator('.view-go').click({ delay: args.delay ? parseFloat(args.delay) : undefined });
}

async function runAimTest(page, args) {
    console.log('Running aim test...');
    await page.goto('https://humanbenchmark.com/tests/aim');
    const targetLocator = page.locator('[data-aim-target="true"]');
    while ((await targetLocator.count()) !== 0 && !endCurrentTest) {
        if (args.delay) await sleep(args.delay);
        await click(page, targetLocator);
    }
}

async function runNumberMemoryTest(page) {
    console.log('Running number memory test...');
    await page.goto('https://humanbenchmark.com/tests/number-memory');
    const testElement = page.locator('.number-memory-test');
    await testElement.locator('button').click();
    while (!endCurrentTest) {
        const number = await testElement.locator('.big-number').textContent();
        await page.waitForSelector('.save-hint.faint-label', { timeout: (number.length * 1000) + 10000 });
        await testElement.locator('input').fill(number);
        await testElement.locator('button').click();
        await page.waitForSelector('.showanswer');
        await testElement.locator('button').click();
    }
}

async function runVerbalMemoryTest(page) {
    console.log('Running verbal memory test...');
    await page.goto('https://humanbenchmark.com/tests/verbal-memory');
    const testElement = page.locator('.verbal-memory-test');
    await testElement.locator('button').click();
    const seenWords = new Set();
    while (!endCurrentTest) {
        const word = (await testElement.locator('.word').textContent()).toLowerCase().trim();
        const button = seenWords.has(word) ? 'SEEN' : 'NEW';
        await testElement.getByRole('button', { name: button }).click();
        if (!seenWords.has(word)) seenWords.add(word);
    }
}

async function asyncSort(array, compareFunction) {
    if (array.length <= 1) {
        return array;
    }

    const pivot = array[Math.floor(Math.random() * array.length)];
    const left = [];
    const right = [];

    for (const element of array) {
        if (element !== pivot) {
            const comparison = await compareFunction(element, pivot);
            if (comparison < 0) {
                left.push(element);
            } else if (comparison > 0) {
                right.push(element);
            }
        }
    }

    const sortedLeft = await asyncSort(left, compareFunction);
    const sortedRight = await asyncSort(right, compareFunction);

    return [...sortedLeft, pivot, ...sortedRight];
}

async function runChimpTest(page, args) {
    console.log('Running chimp test...');
    await page.goto('https://humanbenchmark.com/tests/chimp');
    const testElement = page.locator('[data-test="true"]');
    await testElement.locator('button').click();
    let curi = 4;
    while (!endCurrentTest && curi < 41) {
        const cellElements = await asyncSort(await (page.locator('[data-cellnumber]').all()), async (a, b) => {
            const cellNumberA = parseInt(await a.getAttribute('data-cellnumber'));
            const cellNumberB = parseInt(await b.getAttribute('data-cellnumber'));
            return cellNumberA - cellNumberB;
        });
        const cellCoords = await Promise.all(cellElements.map(coord));
        for (const [x, y] of cellCoords) {
            if (args.delay) await sleep(args.delay);
            await page.mouse.click(x, y);
        }
        curi++;
        if (curi < 41) await testElement.getByRole('button', { name: 'Continue' }).click();
    }
}

/**
 * 
 * @param {import('playwright').Page} page 
 */
async function runMemoryTest(page) {
    console.log('Running memory test...');
    await page.goto('https://humanbenchmark.com/tests/memory');
    const testElement = page.locator('[data-test="true"]');
    await testElement.locator('button').click();

    while (!endCurrentTest) {
        // Step 1. Get the current pattern
        await testElement.locator('.active').first().waitFor({ state: 'attached' })
        let selectors = await testElement.locator('.active').all();
        let cellCoords = await Promise.all(selectors.map(coord));

        // Step 2. Repeat pattern
        await testElement.locator('.active').first().waitFor({ state: 'detached' });
        for (const [x, y] of cellCoords) {
            await page.mouse.click(x, y);
        }
        await testElement.locator('.active').first().waitFor({ state: 'detached' });
    }
}

/**
 * 
 * @param {import('playwright').Page} page 
 */
async function runSequenceMemoryTest(page, args) {
    console.log('Running sequence test...');
    await page.goto('https://humanbenchmark.com/tests/sequence');
    const testElement = page.locator('[data-test="true"]');
    await testElement.locator('button').click();

    let numExpect = 0;
    while (!endCurrentTest) {
        // Step 1. Get the current pattern
        numExpect++;
        let cellCoords = [];
        while (cellCoords.length < numExpect) {
            let cell = testElement.locator('.active');
            await cell.waitFor({ state: 'attached' });
            cellCoords.push(await coord(cell));
            await page.waitForFunction((e) => {
                return !e.classList.contains('active')
            }, await cell.elementHandle())
            
        }

        await testElement.locator('.active').waitFor({ state: 'detached' });
        for (const [x, y] of cellCoords) {
            if (args.delay) await sleep(args.delay);
            await page.mouse.click(x, y);
        }
        await testElement.locator('.active').waitFor({ state: 'detached' });
    }
}

async function runTypingTest(page, args) {
    console.log('Running typing test...');
    console.warn('For speed reasons, this test can only be quit by exiting the program');
    await page.goto('https://humanbenchmark.com/tests/typing');
    const letters = page.locator('.letters');
    const text = await letters.textContent();
    const delay = args.delay ? parseFloat(args.delay) : args.wordsperminute ? calcDelay(args.wordsperminute) : undefined;
    await letters.pressSequentially(text, { delay, timeout: delay ? (delay * text.length) + (30 * 1000) : undefined });
}

function calcDelay(wpm) {
    const timePerWordSeconds = 60 / wpm;
    const timePerLetterSeconds = timePerWordSeconds / 5;
    const timePerLetterMs = timePerLetterSeconds * 1000;
    return timePerLetterMs;
}

async function click(page, locator) {
    const [x, y] = await coord(locator);
    await page.mouse.click(x, y);
}

async function coord(loc) {
    const boundingBox = await loc.boundingBox();
    return [boundingBox.x + boundingBox.width / 2, boundingBox.y + boundingBox.height / 2];
}

const testRunners = {
    reactiontime: [runReactionTimeTest, ["delay"], ["rt", "reaction"]],
    aim: [runAimTest, ["delay"], []],
    'number-memory': [runNumberMemoryTest, [], ["nm", "num-mem"]],
    'verbal-memory': [runVerbalMemoryTest, [], ["vm", "verbal-mem"]],
    chimp: [runChimpTest, ["delay"], []],
    memory: [runMemoryTest, [], ["mem"]],
    typing: [runTypingTest, ["delay", "wordperminute"], ["wpm"]],
    sequence: [runSequenceMemoryTest, ["delay"], ["seq"]]
};

const args = {
    "delay": ["-d, --delay [time]", "The delay between action, in ms"],
    "wordperminute": ["-wpm, --wordsperminute [wpm]", "How many words per minute to type"]
}

const program = new Command();
program
    .name("not-so-human-benchmark")
    .version("1.0.0")
    .description("How fast can a robot complete the Human Benchmark?")

let runners = Object.entries(testRunners);
for (let [cmd, [, meta, aliases]] of runners) {
    let pcmd = program.command(cmd);
    pcmd.aliases(aliases);
    for (let i = 0; i < meta.length; i++) {
        let arg = args[meta[i]];
        pcmd.option(...arg);
    }
    pcmd.action((args) => {
        runTest(cmd, args)
    })
}

program.parse(process.argv)