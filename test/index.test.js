import test from 'node:test';
import assert from 'node:assert/strict';
import { writeFile, readFile, rm } from 'node:fs/promises';
import { parseJSON, serializeJSON, parseCSV, serializeCSV, fetchURL, scrapeHTML } from '../src/index.js';
import { createServer } from 'node:http';

const sampleJSON = '{"name":"Alice","age":30}';
const sampleCSV = 'name,age
Bob,25
Carol,28';
const sampleHTML = '<html><body><a href="/test1">Link1</a><a href="/test2">Link2</a></body></html>';

test('parseJSON returns correct object', async () => {
  const obj = parseJSON(sampleJSON);
  assert.deepEqual(obj, { name: 'Alice', age: 30 });
});

test('serializeJSON pretty prints', async () => {
  const str = serializeJSON({ foo: 'bar' }, true);
  assert.ok(str.includes('
'));
});

test('parseCSV converts to array of objects', async () => {
  const rows = parseCSV(sampleCSV);
  assert.deepEqual(rows, [
    { name: 'Bob', age: '25' },
    { name: 'Carol', age: '28' }
  ]);
});

test('serializeCSV produces correct CSV string', async () => {
  const arr = [
    { name: 'Dave', age: '40' },
    { name: 'Eve', age: '35' }
  ];
  const csv = serializeCSV(arr);
  assert.equal(csv, 'name,age
Dave,40
Eve,35');
});

test('fetchURL retrieves served content', async () => {
  const server = createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('hello world');
  });
  await new Promise(resolve => server.listen(0, resolve));
  const port = server.address().port;
  const url = `http://127.0.0.1:${port}`;
  const body = await fetchURL(url);
  assert.equal(body, 'hello world');
  server.close();
});

test('scrapeHTML extracts regex matches', async () => {
  const matches = scrapeHTML(sampleHTML, '<a\\s+href="[^"]+">[^<]+<\\/a>');
  assert.deepEqual(matches, [
    '<a href="/test1">Link1</a>',
    '<a href="/test2">Link2</a>'
  ]);
});
