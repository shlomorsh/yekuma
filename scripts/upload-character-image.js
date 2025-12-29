/**
 * סקריפט להעלאת תמונת דמות ל-Supabase Storage
 * 
 * שימוש:
 * node scripts/upload-character-image.js
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// קבל את המפתחות מ-Supabase MCP או מהסביבה
const SUPABASE_URL = 'https://ishaaqrqgxjdtjmaxhpx.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlzaGFhcXJxZ3hqZHRqbWF4aHB4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY3MDI5NzgsImV4cCI6MjA4MjI3ODk3OH0.RtTlggJ6i0rDHdEYSANOe1SDKkBSsLP3RaJFNYbBV3A';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const CHARACTER_NAME = 'שמונה שכטר';
const IMAGE_PATH = path.join(__dirname, '..', 'public', 'character', 'shmone.png');
const STORAGE_PATH = 'public/character/shmone.png';

async function uploadImage() {
  console.log('🚀 מתחיל העלאת תמונה...\n');

  try {
    // בדוק אם הקובץ קיים
    if (!fs.existsSync(IMAGE_PATH)) {
      console.error(`❌ שגיאה: הקובץ לא נמצא ב-${IMAGE_PATH}`);
      process.exit(1);
    }

    console.log(`📁 קורא קובץ: ${IMAGE_PATH}`);
    const fileBuffer = fs.readFileSync(IMAGE_PATH);
    const fileName = path.basename(IMAGE_PATH);

    // בדוק אם bucket קיים, אם לא - נצטרך ליצור אותו ידנית ב-Supabase Dashboard
    console.log(`📤 מעלה תמונה ל-Storage: ${STORAGE_PATH}`);

    // נסה להעלות את התמונה
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('images') // או 'public' או שם bucket אחר
      .upload(STORAGE_PATH, fileBuffer, {
        contentType: 'image/png',
        upsert: true // אם הקובץ כבר קיים, החלף אותו
      });

    if (uploadError) {
      console.error('❌ שגיאה בהעלאת התמונה:', uploadError.message);
      
      // אם ה-bucket לא קיים, נסה עם bucket אחר או צור אותו
      if (uploadError.message.includes('Bucket not found') || uploadError.message.includes('not found')) {
        console.log('\n💡 טיפ: ייתכן שה-bucket לא קיים. נסה:');
        console.log('   1. לך ל-Supabase Dashboard → Storage');
        console.log('   2. צור bucket בשם "images" או "public"');
        console.log('   3. הגדר את ה-bucket כ-public');
        console.log('   4. הרץ את הסקריפט שוב');
      }
      
      // נסה עם bucket בשם 'public'
      console.log('\n🔄 מנסה עם bucket "public"...');
      const { data: uploadData2, error: uploadError2 } = await supabase.storage
        .from('public')
        .upload(STORAGE_PATH, fileBuffer, {
          contentType: 'image/png',
          upsert: true
        });

      if (uploadError2) {
        console.error('❌ שגיאה גם עם bucket "public":', uploadError2.message);
        process.exit(1);
      }

      console.log('✅ התמונה הועלתה בהצלחה!');
      await updateCharacterRecord(uploadData2.path);
      return;
    }

    console.log('✅ התמונה הועלתה בהצלחה!');
    await updateCharacterRecord(uploadData.path);

  } catch (error) {
    console.error('❌ שגיאה כללית:', error.message);
    process.exit(1);
  }
}

async function updateCharacterRecord(imagePath) {
  console.log('\n📝 מעדכן את רשומת הדמות...');

  try {
    // קבל את ה-URL הציבורי של התמונה
    const { data: urlData } = supabase.storage
      .from('images')
      .getPublicUrl(imagePath);

    // אם לא עבד, נסה עם 'public'
    let publicUrl = urlData?.publicUrl;
    if (!publicUrl) {
      const { data: urlData2 } = supabase.storage
        .from('public')
        .getPublicUrl(imagePath);
      publicUrl = urlData2?.publicUrl;
    }

    // אם עדיין אין URL, נסה לבנות אותו ידנית
    if (!publicUrl) {
      publicUrl = `${SUPABASE_URL}/storage/v1/object/public/images/${imagePath}`;
    }

    console.log(`🔗 URL של התמונה: ${publicUrl}`);

    // עדכן את הרשומה ב-DB
    const { data, error } = await supabase
      .from('characters')
      .update({ image_url: publicUrl })
      .eq('title', CHARACTER_NAME)
      .select();

    if (error) {
      console.error('❌ שגיאה בעדכון הרשומה:', error.message);
      process.exit(1);
    }

    if (data && data.length > 0) {
      console.log(`✅ רשומת "${CHARACTER_NAME}" עודכנה בהצלחה!`);
      console.log(`   ID: ${data[0].id}`);
      console.log(`   Image URL: ${data[0].image_url}`);
    } else {
      console.log('⚠️  לא נמצאה רשומה לעדכון');
    }

  } catch (error) {
    console.error('❌ שגיאה בעדכון הרשומה:', error.message);
    process.exit(1);
  }
}

uploadImage();

