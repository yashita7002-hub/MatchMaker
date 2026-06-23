import fs from 'fs';

async function testUpload() {
  // Create a minimal 1x1 valid PNG image instead of text
  const base64png = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==";
  const fileContent = Buffer.from(base64png, 'base64');
  
  const formData = new FormData();
  const blob = new Blob([fileContent], { type: 'image/png' });
  formData.append('image', blob, 'test.png');

  try {
    const res = await fetch('http://localhost:3001/api/upload', {
      method: 'POST',
      body: formData,
    });
    const text = await res.text();
    console.log('Status:', res.status);
    console.log('Response:', text);
  } catch (err) {
    console.error('Error:', err.message);
  }
}

testUpload();
