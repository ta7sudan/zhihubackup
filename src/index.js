const puppeteer = require('puppeteer');
const cookies = require('./cookies');
const fs = require('fs');

function sleep(time) {
	return new Promise(rs => setTimeout(rs, time));
}

function getAllTitleAndURL() {
	const a = document.querySelectorAll('.ContentItem-title > a');
	return Promise.resolve(Array.from(a).map(v => ({ title: v.textContent, url: v.href })));
}

async function zhuanlan(browser, page, p) {
	await page.goto(`https://www.zhihu.com/people/canto_ostinato/posts?page=${p}`);
	await sleep(4000);
	const articles = await page.evaluate(getAllTitleAndURL);
	for (const article of articles) {
		const file = `./articles/${article.title.replace(/[?:/*<>"|\s]/g, '')}.pdf`;
		if (fs.existsSync(file)) {
			continue;
		}
		const np = await browser.newPage();
		await np.goto(article.url);
		await sleep(2000);
		for (let i = 0; i < 10; ++i) {
			await np.evaluate(scroll(i * 800));
			await sleep(rand(1, 5) * 1000);
		}
		try {
			await np.pdf({
				path: file,
				printBackground: true,
				displayHeaderFooter: true
			});
		} catch (e) {
			console.error(e.message);
		}
		await np.close();
	}
}

function rand(min, max) {
	return Math.floor(Math.random() * (max - min + 1)) + min;
}

function getAllAnswerAndURL() {
	const a = document.querySelectorAll('.ContentItem-title a');
	return Promise.resolve(Array.from(a).map(v => ({ title: v.textContent, url: v.href })));
}

async function answer(browser, page, p) {
	await page.goto(`https://www.zhihu.com/people/canto_ostinato/answers?page=${p}`);
	const answers = await page.evaluate(getAllAnswerAndURL);
	for (const answer of answers) {
		const file = `./answers/${answer.title.replace(/[?:/*<>"|\s]/g, '')}.pdf`;
		if (fs.existsSync(file)) {
			continue;
		}
		const np = await browser.newPage();
		await np.goto(answer.url);
		await sleep(rand(1, 5) * 1000);
		try {
			await np.pdf({
				path: file,
				printBackground: true,
				displayHeaderFooter: true
			});
		} catch (e) {
			console.error(e.message);
		}
		await np.close();
	}

}

function scroll(y) {
	return `document.documentElement.scrollTop = ${y}`;
}


(async () => {
	process.on('unhandledRejection', err => {
		console.log(err.message);
		page.screenshot({
			path: './test.png',
			fullPage: true
		});
	});

	const browser = await puppeteer.launch({
		executablePath: 'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe'
	});
	const page = await browser.newPage();


	await page.setCookie(...cookies);

	await zhuanlan(browser, page, 1);
	await zhuanlan(browser, page, 2);

	for (let i = 1; i <= 32;) {
		try {
			await answer(browser, page, i);
			await sleep(5000);
			++i
		} catch (err) {
			console.error(err.message);
			console.log(`page: ${i}, 下次请从这里开始`);
		}
	}

	await page.screenshot({
		path: './test.png',
		fullPage: true
	});

	await page.close();
	await browser.close();
})();
