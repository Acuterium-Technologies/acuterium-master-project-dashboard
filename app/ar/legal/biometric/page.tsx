/**
 * GDPR Article 9 + Oman PDPL biometric disclosure · Arabic · Phase 3d-i.06.
 *
 * Public route — NOT gated. Mirrors /legal/biometric in Arabic with RTL
 * layout. Translation follows the canonical Acuterium-Arabic style used
 * in the RUZN.AI sister project.
 *
 * Classification: ACUTERIUM-INTERNAL // SOVEREIGN
 */
import type { Metadata } from 'next';
import Link from 'next/link';

import '../../../../src/styles/master-ops.css';
import '../../../../src/styles/biometrics.css';

export const metadata: Metadata = {
  title: 'الإفصاح عن بيانات القياسات الحيوية · أكوتيريوم',
  description:
    'إفصاح المادة 9 من اللائحة العامة لحماية البيانات وقانون حماية البيانات الشخصية العماني لقناة استشعار Face2Feel.',
};

export default function BiometricDisclosurePageAr() {
  return (
    <main className="acu-master-ops acu-legal-page" lang="ar" dir="rtl" data-qa="biometric-disclosure-ar">
      <p className="acu-lede">
        اقرأ هذا الإفصاح أيضًا بـ{' '}
        <Link href="/legal/biometric" className="acu-link" lang="en" dir="ltr">
          English
        </Link>
        .
      </p>

      <h1>الإفصاح عن معالجة بيانات القياسات الحيوية</h1>

      <p>
        بموجب المادة 9 من اللائحة العامة لحماية البيانات الأوروبية (GDPR)
        وقانون حماية البيانات الشخصية في سلطنة عُمان (المرسوم السلطاني
        6/2022)، تُعدُّ بيانات القياسات الحيوية فئةً خاصةً تتطلب موافقةً صريحة
        وإفصاحًا شفافًا عن المعالجة. هذه الصفحة هي الإفصاح القانوني المعتمد
        لقناة استشعار Face2Feel ضمن لوحة أكوتيريوم لعمليات الأوبس الرئيسة.
      </p>

      <h2>ما الذي نعالجه</h2>
      <ul>
        <li>إطارات الكاميرا بمعدّل 5 إطارات في الثانية بدقة 320×240</li>
        <li>معالم الوجه (468 نقطة · MediaPipe Face Mesh)</li>
        <li>
          متجه احتمالات المشاعر السبع (محايد / سعيد / حزين / غاضب / خائف /
          مشمئز / متفاجئ)
        </li>
      </ul>

      <h2>ما الذي نحتفظ به</h2>
      <ul>
        <li>
          متجه عاطفي خماسي المحاور
          (<strong>الإجهاد</strong>، <strong>التركيز</strong>،{' '}
          <strong>الفضول</strong>، <strong>الإرهاق</strong>،{' '}
          <strong>الرضا</strong>)
        </li>
        <li>يُخزَّن فقط في التخزين المحلي للمتصفح</li>
        <li>لا يُرسَل إلى أي خادم على الإطلاق</li>
      </ul>

      <h2>ما نحذفه فورًا</h2>
      <ul>
        <li>كل إطار من الكاميرا (خلال 16 مللي ثانية من الالتقاط)</li>
        <li>كل مصفوفة لمعالم الوجه (خلال إطار الرسم نفسه)</li>
        <li>كل متجه عاطفي خام (بعد تحويله إلى PATHOS)</li>
      </ul>

      <h2>أين تتم المعالجة</h2>
      <p>
        مئة بالمئة داخل متصفحك. تُحمَّل جميع نماذج التعلم الآلي
        (MediaPipe Tasks Vision وface-api.js) مرة واحدة من هذا الموقع وتُخزَّن
        محليًا بواسطة عامل الخدمة. لا يوجد استدلال سحابي ولا معالج بيانات
        خارجي. منصة أكوتيريوم لا تستقبل بياناتك الحيوية أبدًا.
      </p>

      <h2>حقوقك</h2>
      <ul>
        <li>
          إلغاء الموافقة في أي وقت من{' '}
          <Link href="/master-ops/settings/biometrics" className="acu-link">
            الإعدادات · القياسات الحيوية
          </Link>
          .
        </li>
        <li>طلب الوصول إلى بيانات الفرد (DSAR): يصل في المرحلة 3d-v.</li>
        <li>الحق في المحو: يمسح إدخالات التخزين المحلي بالكامل.</li>
      </ul>

      <h2>الأساس القانوني</h2>
      <p>
        المادة 9 (2)(أ) GDPR — الموافقة الصريحة. الحالة الافتراضية هي{' '}
        <strong>إيقاف</strong>. كل مستوى موافقة (الجلسة فقط · دائم) يتطلب
        إجراءً إيجابيًا من المستخدم.
      </p>

      <h2>المسؤول عن البيانات</h2>
      <p>
        شركة أكوتيريوم للتقنيات · مسقط، سلطنة عُمان · جهة الاتصال للامتثال:{' '}
        <a href="mailto:chairman@celebrity-global.com" className="acu-link">
          chairman@celebrity-global.com
        </a>
        .
      </p>
      <p>
        إشعار النقل عبر الحدود: <strong>لا يوجد</strong>. جميع عمليات
        المعالجة محلية داخل المتصفح ولا تعبر أي شبكة.
      </p>

      <h2>إسناد المصادر المفتوحة</h2>
      <ul>
        <li>
          MediaPipe Tasks Vision · Apache-2.0 ·{' '}
          <a href="/models/face2feel/LICENSE-Apache-2.0.txt" className="acu-link">
            الترخيص
          </a>
        </li>
        <li>
          face-api.js · MIT ·{' '}
          <a href="/models/face2feel/LICENSE-MIT.txt" className="acu-link">
            الترخيص
          </a>
        </li>
        <li>TensorFlow.js · Apache-2.0 (تبعية)</li>
      </ul>
    </main>
  );
}
