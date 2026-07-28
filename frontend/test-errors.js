import puppeteer from 'puppeteer';

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  
  await page.setRequestInterception(true);
  page.on('request', request => {
    if (request.url().includes('/users/profile') && request.method() === 'GET') {
      request.respond({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          fullName: 'Test',
          email: 'test@test.com',
          mobile: '1234567890',
          mohalla: 'Burhani',
          gender: 'Male',
          age: 30,
          dobEnglish: '1990-01-01',
          dobHijri: '15 Shaban 1445'
        })
      });
    } else if (request.url().includes('/mohallas') && request.method() === 'GET') {
      request.respond({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([])
      });
    } else {
      request.continue();
    }
  });

  page.on('console', msg => {
    if (msg.type() === 'error' || msg.type() === 'warning') {
      console.log(`[${msg.type()}] ${msg.text()}`);
    }
  });

  page.on('pageerror', err => {
    console.log(`[pageerror] ${err.message}`);
  });

  try {
    await page.goto('http://localhost:5174/login', { waitUntil: 'networkidle2' });
    await page.evaluate(() => {
      sessionStorage.setItem('user', JSON.stringify({ token: "fake", role: "USER", fullName: "Test", email: "test@test.com" }));
    });
    
    await page.goto('http://localhost:5174/profile', { waitUntil: 'networkidle2' });
    
    const errorText = await page.evaluate(() => {
      const el = document.querySelector('.text-red-500');
      return el ? el.innerText : null;
    });
    
    if (errorText) {
      console.log("REACT ERROR BOUNDARY CAUGHT:");
      console.log(errorText);
    } else {
      console.log("No error boundary triggered.");
    }
  } catch (err) {
    console.error("Failed to load page:", err);
  }
  
  await browser.close();
})();
