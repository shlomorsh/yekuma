/**
 * סקריפט לבדיקת הגדרות Vercel
 * 
 * שימוש:
 * 1. התקן Vercel CLI: npm i -g vercel
 * 2. התחבר: vercel login
 * 3. הרץ: node scripts/check-vercel-config.js
 * 
 * או השתמש ב-Vercel API ישירות עם API token
 */

const https = require('https');

// קבל את ה-API token מ-Vercel Dashboard → Settings → Tokens
const VERCEL_TOKEN = process.env.VERCEL_TOKEN || '';
const PROJECT_NAME = 'yekumot-app'; // או השם של הפרויקט שלך ב-Vercel

if (!VERCEL_TOKEN) {
  console.error('❌ שגיאה: צריך להגדיר VERCEL_TOKEN');
  console.log('איך להגדיר:');
  console.log('1. לך ל-Vercel Dashboard → Settings → Tokens');
  console.log('2. צור Token חדש');
  console.log('3. הרץ: export VERCEL_TOKEN=your_token_here');
  console.log('4. או הוסף את זה ל-.env.local');
  process.exit(1);
}

function makeRequest(path) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'api.vercel.com',
      path: path,
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${VERCEL_TOKEN}`,
        'Content-Type': 'application/json'
      }
    };

    https.get(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          if (res.statusCode === 200) {
            resolve(json);
          } else {
            reject(new Error(`HTTP ${res.statusCode}: ${json.error?.message || data}`));
          }
        } catch (e) {
          reject(new Error(`Failed to parse response: ${data}`));
        }
      });
    }).on('error', (err) => {
      reject(err);
    });
  });
}

async function checkProject() {
  console.log('🔍 בודק הגדרות Vercel...\n');

  try {
    // קבל רשימת פרויקטים
    console.log('1️⃣ בודק פרויקטים...');
    const projects = await makeRequest('/v9/projects');
    const project = projects.projects?.find(p => p.name === PROJECT_NAME);
    
    if (!project) {
      console.log(`❌ לא נמצא פרויקט בשם "${PROJECT_NAME}"`);
      console.log('📋 פרויקטים זמינים:');
      projects.projects?.forEach(p => {
        console.log(`   - ${p.name} (${p.id})`);
      });
      return;
    }

    console.log(`✅ נמצא פרויקט: ${project.name} (${project.id})\n`);

    // בדוק משתני סביבה
    console.log('2️⃣ בודק משתני סביבה...');
    const envVars = await makeRequest(`/v9/projects/${project.id}/env`);
    
    console.log('\n📊 משתני סביבה:');
    const envByTarget = {
      production: [],
      preview: [],
      development: []
    };

    envVars.envs?.forEach(env => {
      const targets = [];
      if (env.target?.includes('production')) targets.push('Production');
      if (env.target?.includes('preview')) targets.push('Preview');
      if (env.target?.includes('development')) targets.push('Development');
      
      const targetStr = targets.length > 0 ? targets.join(', ') : '❌ לא מוגדר';
      envByTarget[env.target?.[0] || 'unknown'].push({
        key: env.key,
        target: targetStr,
        hasValue: !!env.value
      });
    });

    console.log('\n🔴 Production:');
    const prodVars = envVars.envs?.filter(e => e.target?.includes('production')) || [];
    if (prodVars.length === 0) {
      console.log('   ❌ אין משתני סביבה ל-Production!');
    } else {
      prodVars.forEach(env => {
        const status = env.value ? '✅' : '❌';
        console.log(`   ${status} ${env.key} (${env.target?.join(', ')})`);
      });
    }

    console.log('\n🟡 Preview:');
    const previewVars = envVars.envs?.filter(e => e.target?.includes('preview')) || [];
    if (previewVars.length === 0) {
      console.log('   ❌ אין משתני סביבה ל-Preview!');
    } else {
      previewVars.forEach(env => {
        const status = env.value ? '✅' : '❌';
        console.log(`   ${status} ${env.key} (${env.target?.join(', ')})`);
      });
    }

    // בדוק deployments
    console.log('\n3️⃣ בודק deployments...');
    const deployments = await makeRequest(`/v6/deployments?projectId=${project.id}&limit=5`);
    
    console.log('\n📦 Deployments אחרונים:');
    deployments.deployments?.forEach((deploy, i) => {
      const status = deploy.readyState === 'READY' ? '✅' : 
                     deploy.readyState === 'ERROR' ? '❌' : '⏳';
      const url = deploy.url || 'N/A';
      const target = deploy.target === 'production' ? '🔴 Production' : 
                     deploy.target === 'preview' ? '🟡 Preview' : '⚪ Other';
      console.log(`   ${status} ${target}: ${url}`);
      console.log(`      State: ${deploy.readyState}`);
      console.log(`      Created: ${new Date(deploy.createdAt).toLocaleString()}`);
      if (i < deployments.deployments.length - 1) console.log('');
    });

    // בדוק domains
    console.log('\n4️⃣ בודק domains...');
    try {
      const domains = await makeRequest(`/v9/projects/${project.id}/domains`);
      console.log('\n🌐 Domains:');
      if (domains.domains?.length === 0) {
        console.log('   ⚠️  אין domains מוגדרים');
      } else {
        domains.domains.forEach(domain => {
          const status = domain.verified ? '✅' : '⚠️';
          console.log(`   ${status} ${domain.name} (${domain.verified ? 'Verified' : 'Not Verified'})`);
          if (domain.redirect) {
            console.log(`      → Redirects to: ${domain.redirect}`);
          }
        });
      }
      
    } catch (err) {
      console.log('   ⚠️  לא ניתן לבדוק domains:', err.message);
    }

    // סיכום
    console.log('\n' + '='.repeat(50));
    console.log('📋 סיכום:');
    
    const missingProdVars = prodVars.filter(e => !e.value || !e.target?.includes('production'));
    if (missingProdVars.length > 0) {
      console.log('\n❌ בעיות שנמצאו:');
      console.log('   - משתני סביבה חסרים או לא מוגדרים ל-Production');
      console.log('   - לך ל-Vercel Dashboard → Settings → Environment Variables');
      console.log('   - ודא שלכל משתנה יש סימון ✅ ב-Production');
    } else {
      console.log('\n✅ נראה שהכל תקין!');
    }

  } catch (error) {
    console.error('❌ שגיאה:', error.message);
    if (error.message.includes('401') || error.message.includes('403')) {
      console.log('\n💡 טיפ: ודא שה-VERCEL_TOKEN תקין ויש לו הרשאות מתאימות');
    }
  }
}

checkProject();


