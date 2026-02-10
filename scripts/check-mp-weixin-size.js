'use strict';

const fs = require('fs');
const path = require('path');

function formatBytes(bytes) {
  const mib = bytes / (1024 * 1024);
  if (mib >= 1) return `${mib.toFixed(2)} MiB`;
  const kib = bytes / 1024;
  if (kib >= 1) return `${kib.toFixed(1)} KiB`;
  return `${bytes} B`;
}

function walkFiles(dir) {
  const out = [];
  const stack = [dir];
  while (stack.length) {
    const cur = stack.pop();
    const entries = fs.readdirSync(cur, { withFileTypes: true });
    for (const ent of entries) {
      const full = path.join(cur, ent.name);
      if (ent.isDirectory()) {
        stack.push(full);
      } else if (ent.isFile()) {
        out.push(full);
      }
    }
  }
  return out;
}

function sumBytes(files) {
  let total = 0;
  for (const f of files) total += fs.statSync(f).size;
  return total;
}

function readSubpackageRootsFromPagesJson(projectRoot) {
  const pagesJsonPath = path.join(projectRoot, 'pages.json');
  if (!fs.existsSync(pagesJsonPath)) return [];
  let raw = fs.readFileSync(pagesJsonPath, 'utf8');
  // pages.json in uni-app supports conditional compilation comments (e.g. // #ifdef ...),
  // so we need to strip comments before JSON.parse.
  raw = raw.replace(/^\uFEFF/, '');
  raw = raw.replace(/\/\*[\s\S]*?\*\//g, '');
  raw = raw
    .split(/\r?\n/)
    .filter((line) => !line.trim().startsWith('//'))
    .join('\n');
  const cfg = JSON.parse(raw);
  const roots = (cfg.subPackages || []).map((p) => p.root).filter(Boolean);
  // unique
  return Array.from(new Set(roots));
}

function main() {
  const projectRoot = path.resolve(__dirname, '..');
  const buildDir = path.join(projectRoot, 'unpackage', 'dist', 'build', 'mp-weixin');

  if (!fs.existsSync(buildDir)) {
    console.error(`[size-check] Build output not found: ${buildDir}`);
    console.error('[size-check] Run HBuilderX 发行/构建到 mp-weixin 后再执行此检查。');
    process.exit(2);
  }

  const files = walkFiles(buildDir);
  const totalBytes = sumBytes(files);

  const appWxssPath = path.join(buildDir, 'app.wxss');
  const vendorJsPath = path.join(buildDir, 'common', 'vendor.js');
  const appWxssBytes = fs.existsSync(appWxssPath) ? fs.statSync(appWxssPath).size : null;
  const vendorBytes = fs.existsSync(vendorJsPath) ? fs.statSync(vendorJsPath).size : null;

  const subRoots = readSubpackageRootsFromPagesJson(projectRoot);
  let subBytes = 0;
  const subBreakdown = [];
  for (const r of subRoots) {
    const p = path.join(buildDir, r);
    if (!fs.existsSync(p)) continue;
    const b = sumBytes(walkFiles(p));
    subBytes += b;
    subBreakdown.push({ root: r, bytes: b });
  }

  const mainApproxBytes = totalBytes - subBytes;

  const topN = 20;
  const top = files
    .map((f) => ({ file: f, bytes: fs.statSync(f).size }))
    .sort((a, b) => b.bytes - a.bytes)
    .slice(0, topN)
    .map((x) => ({ ...x, rel: path.relative(buildDir, x.file) }));

  console.log('[size-check] buildDir:', buildDir);
  console.log('[size-check] total:', formatBytes(totalBytes));
  console.log('[size-check] mainApprox (total - subPackages roots):', formatBytes(mainApproxBytes));
  if (appWxssBytes != null) console.log('[size-check] app.wxss:', formatBytes(appWxssBytes));
  if (vendorBytes != null) console.log('[size-check] common/vendor.js:', formatBytes(vendorBytes));
  if (subBreakdown.length) {
    console.log('[size-check] subPackages breakdown:');
    for (const s of subBreakdown.sort((a, b) => b.bytes - a.bytes)) {
      console.log(`  - ${s.root}: ${formatBytes(s.bytes)}`);
    }
  }

  console.log(`[size-check] top ${topN} files:`);
  for (const t of top) {
    console.log(`  - ${t.rel}: ${formatBytes(t.bytes)}`);
  }

  const appWxssMaxBytes = parseInt(process.env.WX_APP_WXSS_MAX_BYTES || '', 10) || 300 * 1024;
  const mainMaxBytes = parseInt(process.env.WX_MAIN_MAX_BYTES || '', 10) || Math.floor(1.5 * 1024 * 1024);

  const errors = [];
  if (appWxssBytes != null && appWxssBytes > appWxssMaxBytes) {
    errors.push(`app.wxss too large: ${formatBytes(appWxssBytes)} > ${formatBytes(appWxssMaxBytes)}`);
  }
  if (mainApproxBytes > mainMaxBytes) {
    errors.push(`mainApprox too large: ${formatBytes(mainApproxBytes)} > ${formatBytes(mainMaxBytes)}`);
  }

  if (errors.length) {
    console.error('[size-check] FAIL');
    for (const e of errors) console.error('  -', e);
    console.error('[size-check] Tip: thresholds can be overridden via env: WX_APP_WXSS_MAX_BYTES / WX_MAIN_MAX_BYTES');
    process.exit(1);
  }

  console.log('[size-check] OK');
}

main();
