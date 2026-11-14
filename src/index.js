#!/usr/bin/env node
import { readFileSync, writeFileSync } from 'node:fs';
import { createServer } from 'node:http';
import { request } from 'node:https';
import { URL } from 'node:url';
import process from 'node:process';

/** Parse a JSON string into an object */
export function parseJSON(text) {
  return JSON.parse(text);
}

/** Serialize an object into a JSON string */
export function serializeJSON(obj, pretty = false) {
  return pretty ? JSON.stringify(obj, null, 2) : JSON.stringify(obj);
}

/** Simple CSV parser – returns an array of records (objects) */
export function parseCSV(text) {
  const lines = text.trim().split(/\r?
/);
  const header = lines.shift().split(',').map(h => h.trim());
  return lines.map(line => {
    const values = line.split(',').map(v => v.trim());
    const record = {};
    header.forEach((key, i) => {
      record[key] = values[i] ?? '';
    });
    return record;
  });
}

/** Serialize an array of objects into CSV */
export function serializeCSV(arr) {
  if (!Array.isArray(arr) || arr.length === 0) return '';
  const header = Object.keys(arr[0]);
  const rows = arr.map(obj => header.map(h => obj[h] ?? '').join(','));
  return [header.join(','), ...rows].join('
');
}

/** Fetch a URL (http or https) and return the raw body as a string */
export function fetchURL(target) {
  return new Promise((resolve, reject) => {
    const url = new URL(target);
    const getter = url.protocol === 'https:' ? request : require('node:http').request;
    const req = getter(url, res => {
      let data = '';
      res.setEncoding('utf8');
      res.on('data', chunk => (data += chunk));
      res.on('end', () => resolve(data));
    });
    req.on('error', reject);
    req.end();
  });
}

/** Very small scraper – extracts all matches of a RegExp from HTML */
export function scrapeHTML(html, pattern) {
  const regex = new RegExp(pattern, 'g');
  const matches = [];
  let m;
  while ((m = regex.exec(html)) !== null) {
    matches.push(m[0]);
  }
  return matches;
}

/** CLI argument parser */
function printHelp() {
  console.log(`zero-data-cli – Fast zero‑dependency data utility

Usage:
  zero-data parse json <file>
  zero-data parse csv <file>
  zero-data serialize json <inputFile> <outputFile> [--pretty]
  zero-data serialize csv <inputFile> <outputFile>
  zero-data fetch <url>
  zero-data scrape <url> <regex>
`);
}

async function main() {
  const args = process.argv.slice(2);
  if (args.length === 0) {
    printHelp();
    process.exit(0);
  }

  const command = args[0];
  try {
    switch (command) {
      case 'parse': {
        const type = args[1];
        const file = args[2];
        const content = readFileSync(file, 'utf8');
        if (type === 'json') {
          console.log(JSON.stringify(parseJSON(content), null, 2));
        } else if (type === 'csv') {
          console.log(JSON.stringify(parseCSV(content), null, 2));
        } else {
          console.error('Unsupported parse type');
        }
        break;
      }
      case 'serialize': {
        const type = args[1];
        const inFile = args[2];
        const outFile = args[3];
        const pretty = args.includes('--pretty');
        const content = readFileSync(inFile, 'utf8');
        if (type === 'json') {
          const obj = parseJSON(content);
          writeFileSync(outFile, serializeJSON(obj, pretty), 'utf8');
        } else if (type === 'csv') {
          const arr = parseCSV(content);
          writeFileSync(outFile, serializeCSV(arr), 'utf8');
        } else {
          console.error('Unsupported serialize type');
        }
        break;
      }
      case 'fetch': {
        const url = args[1];
        const body = await fetchURL(url);
        console.log(body);
        break;
      }
      case 'scrape': {
        const url = args[1];
        const pattern = args[2];
        const html = await fetchURL(url);
        const matches = scrapeHTML(html, pattern);
        console.log(JSON.stringify(matches, null, 2));
        break;
      }
      case 'help':
      default:
        printHelp();
    }
  } catch (e) {
    console.error('Error:', e.message);
    process.exit(1);
  }
  process.exit(0);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
