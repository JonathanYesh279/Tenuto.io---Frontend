import React, { useState } from 'react';
import { featureFlagService } from '../services/featureFlagService';

interface HelpSection {
  id: string;
  title: string;
  content: React.ReactNode;
  category: 'getting-started' | 'calculations' | 'ui-changes' | 'troubleshooting';
}

const BagrutHelpDocumentation: React.FC = () => {
  const [activeSection, setActiveSection] = useState<string>('overview');
  const [searchQuery, setSearchQuery] = useState('');

  const isNewSystemEnabled = featureFlagService.isEnabled('new_bagrut_grading_system');

  const helpSections: HelpSection[] = [
    {
      id: 'overview',
      title: 'סקירה כללית',
      category: 'getting-started',
      content: (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">מערכת הבגרויות החדשה</h3>
          <p className="text-gray-700">
            המערכת החדשה מציעה חוויית משתמש משופרת עם חישובים מדויקים יותר ומערכת דיווח מתקדמת.
          </p>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-medium text-blue-900 mb-2">השינויים העיקריים:</h4>
            <ul className="list-disc list-inside text-blue-800 space-y-1">
              <li>מסך חישוב ציונים מחודש</li>
              <li>אלגוריתם חישוב משופר</li>
              <li>מערכת תיעוד ובקרה מתקדמת</li>
              <li>תמיכה במגוון רחב יותר של מקצועות</li>
            </ul>
          </div>
          <div className={`rounded-lg p-3 ${isNewSystemEnabled ? 'bg-green-50 border border-green-200' : 'bg-gray-50 border border-gray-200'}`}>
            <p className={`text-sm ${isNewSystemEnabled ? 'text-green-700' : 'text-gray-600'}`}>
              <strong>מצב נוכחי:</strong> {isNewSystemEnabled ? 'המערכת החדשה זמינה עבורך' : 'אתה משתמש במערכת הקודמת'}
            </p>
          </div>
        </div>
      )
    },
    {
      id: 'new-calculations',
      title: 'חישובי ציונים חדשים',
      category: 'calculations',
      content: (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">אלגוריתם החישוב המשופר</h3>
          <p className="text-gray-700">
            האלגוריתם החדש מביא דיוק גבוה יותר בחישוב ציוני הבגרות ומתחשב בפרמטרים נוספים.
          </p>
          
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <h4 className="font-medium text-yellow-900 mb-2">שינויים בחישוב:</h4>
            <ul className="list-disc list-inside text-yellow-800 space-y-1">
              <li>חישוב משוקלל מדויק יותר של יחידות לימוד</li>
              <li>התחשבות במועדי בחינות</li>
              <li>תמיכה בבונוסים ועדכונים</li>
              <li>חישוב אוטומטי של ממוצעים</li>
            </ul>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <h4 className="font-medium text-gray-900 mb-2">דוגמה לחישוב:</h4>
            <div className="bg-gray-50 p-3 rounded font-mono text-sm">
              <div>מתמטיקה 5 יח': 90 × 5 = 450</div>
              <div>אנגלית 4 יח': 85 × 4 = 340</div>
              <div>פיזיקה 5 יח': 88 × 5 = 440</div>
              <div className="border-t border-gray-300 mt-2 pt-2 font-bold">
                ממוצע משוקלל: 1230 ÷ 14 = 87.86
              </div>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'ui-changes',
      title: 'שינויים בממשק',
      category: 'ui-changes',
      content: (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">ממשק משתמש מחודש</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h4 className="font-medium text-green-900 mb-2">מה חדש:</h4>
              <ul className="list-disc list-inside text-green-800 text-sm space-y-1">
                <li>עיצוב נקי ואינטואיטיבי</li>
                <li>ניווט משופר בין מקצועות</li>
                <li>תצוגת תוצאות בזמן אמת</li>
                <li>כפתורי פעולה ברורים יותר</li>
              </ul>
            </div>
            
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-medium text-blue-900 mb-2">טיפים לשימוש:</h4>
              <ul className="list-disc list-inside text-blue-800 text-sm space-y-1">
                <li>השתמש בתצוגת התפריט הצדדי</li>
                <li>שמור שינויים באופן אוטומטי</li>
                <li>בדוק תקינות הנתונים</li>
                <li>השתמש בכפתור "עזרה" בכל מסך</li>
              </ul>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <h4 className="font-medium text-gray-900 mb-2">קיצורי מקלדת חדשים:</h4>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div><kbd className="bg-gray-100 px-2 py-1 rounded">Ctrl + S</kbd> - שמירה</div>
              <div><kbd className="bg-gray-100 px-2 py-1 rounded">Ctrl + N</kbd> - רשומה חדשה</div>
              <div><kbd className="bg-gray-100 px-2 py-1 rounded">Ctrl + F</kbd> - חיפוש</div>
              <div><kbd className="bg-gray-100 px-2 py-1 rounded">F1</kbd> - עזרה</div>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'troubleshooting',
      title: 'פתרון בעיות',
      category: 'troubleshooting',
      content: (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">בעיות נפוצות ופתרונות</h3>
          
          <div className="space-y-3">
            <div className="border border-gray-200 rounded-lg">
              <div className="bg-gray-50 px-4 py-2 border-b border-gray-200">
                <h4 className="font-medium text-gray-900">הציונים לא מתעדכנים</h4>
              </div>
              <div className="p-4 text-gray-700">
                <p className="mb-2"><strong>פתרון:</strong></p>
                <ol className="list-decimal list-inside space-y-1">
                  <li>וודא שהקשת את הציון בצורה נכונה</li>
                  <li>לחץ על "שמור" לאחר כל שינוי</li>
                  <li>רענן את הדף אם הבעיה נמשכת</li>
                  <li>פנה לתמיכה טכנית אם הבעיה לא נפתרת</li>
                </ol>
              </div>
            </div>

            <div className="border border-gray-200 rounded-lg">
              <div className="bg-gray-50 px-4 py-2 border-b border-gray-200">
                <h4 className="font-medium text-gray-900">שגיאה בחישוב הממוצע</h4>
              </div>
              <div className="p-4 text-gray-700">
                <p className="mb-2"><strong>פתרון:</strong></p>
                <ol className="list-decimal list-inside space-y-1">
                  <li>בדוק שכל המקצועות מוגדרים עם מספר יחידות נכון</li>
                  <li>וודא שאין ציונים ריקים או לא תקינים</li>
                  <li>השתמש בכפתור "חשב מחדש"</li>
                  <li>אם הבעיה נמשכת, פנה למנהל המערכת</li>
                </ol>
              </div>
            </div>

            <div className="border border-gray-200 rounded-lg">
              <div className="bg-gray-50 px-4 py-2 border-b border-gray-200">
                <h4 className="font-medium text-gray-900">הדפסה לא עובדת</h4>
              </div>
              <div className="p-4 text-gray-700">
                <p className="mb-2"><strong>פתרון:</strong></p>
                <ol className="list-decimal list-inside space-y-1">
                  <li>השתמש בכפתור ההדפסה המיוחד במערכת</li>
                  <li>בדוק הגדרות הדפדפן</li>
                  <li>נסה להשתמש בדפדפן אחר</li>
                  <li>ייצא את הנתונים ל-PDF במקום הדפסה ישירה</li>
                </ol>
              </div>
            </div>
          </div>

          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <h4 className="font-medium text-red-900 mb-2">מצב חירום:</h4>
            <p className="text-red-800 mb-2">
              אם המערכת אינה פועלת כמצופה, ניתן לחזור למערכת הקודמת באופן זמני.
            </p>
            <button 
              onClick={() => {
                if (confirm('האם אתה בטוח שברצונך לחזור למערכת הקודמת? פעולה זו תבטל את כל השינויים החדשים.')) {
                  featureFlagService.rollbackBagrutDeployment('User requested manual rollback');
                  window.location.reload();
                }
              }}
              className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition-colors"
            >
              חזור למערכת הקודמת
            </button>
          </div>
        </div>
      )
    },
    {
      id: 'support',
      title: 'צור קשר לתמיכה',
      category: 'troubleshooting',
      content: (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">דרכי קבלת תמיכה</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-medium text-blue-900 mb-2">תמיכה טכנית</h4>
              <div className="space-y-2 text-blue-800">
                <p><strong>טלפון:</strong> 03-1234567</p>
                <p><strong>אימייל:</strong> support@conservatory.example</p>
                <p><strong>שעות פעילות:</strong> א'-ה' 8:00-17:00</p>
              </div>
            </div>

            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h4 className="font-medium text-green-900 mb-2">מנהל המערכת</h4>
              <div className="space-y-2 text-green-800">
                <p><strong>טלפון חירום:</strong> 050-1234567</p>
                <p><strong>אימייל:</strong> admin@conservatory.example</p>
                <p><strong>זמינות:</strong> 24/7 למצבי חירום</p>
              </div>
            </div>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <h4 className="font-medium text-yellow-900 mb-2">לפני פנייה לתמיכה:</h4>
            <ul className="list-disc list-inside text-yellow-800 space-y-1">
              <li>נסה לפתור את הבעיה באמצעות מדריך פתרון הבעיות</li>
              <li>הכן מידע על הבעיה (מה ניסית לעשות, מה קרה, הודעות שגיאה)</li>
              <li>צלם מסך של הבעיה במידת האפשר</li>
              <li>ציין את שם המשתמש והזמן בו אירעה הבעיה</li>
            </ul>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <h4 className="font-medium text-gray-900 mb-2">שליחת משוב על המערכת:</h4>
            <p className="text-gray-700 mb-3">
              המשוב שלך חשוב לנו לשיפור המערכת. אנא שתף אותנו בחוויית השימוש שלך.
            </p>
            <button 
              onClick={() => {
                window.open('mailto:feedback@conservatory.example?subject=משוב על מערכת הבגרויות החדשה', '_blank');
              }}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors"
            >
              שלח משוב
            </button>
          </div>
        </div>
      )
    }
  ];

  const categories = {
    'getting-started': 'תחילת עבודה',
    'calculations': 'חישובים',
    'ui-changes': 'שינויי ממשק',
    'troubleshooting': 'פתרון בעיות'
  };

  const filteredSections = helpSections.filter(section =>
    searchQuery === '' ||
    section.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    section.category.includes(searchQuery.toLowerCase())
  );

  const currentSection = helpSections.find(s => s.id === activeSection) || helpSections[0];

  return (
    <div className="max-w-4xl mx-auto p-6" id="bagrut-help">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">מרכז העזרה - מערכת הבגרויות</h1>
        <p className="text-gray-600">מדריכים ופתרונות לשימוש במערכת הבגרויות החדשה</p>
      </div>

      <div className="mb-6">
        <div className="relative">
          <input
            type="text"
            placeholder="חיפוש נושאים..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <svg className="absolute left-3 top-2.5 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
      </div>

      <div className="flex gap-6">
        <div className="w-1/4">
          <nav className="space-y-1">
            {Object.entries(categories).map(([categoryKey, categoryName]) => {
              const sectionsInCategory = filteredSections.filter(s => s.category === categoryKey);
              if (sectionsInCategory.length === 0) return null;
              
              return (
                <div key={categoryKey} className="mb-4">
                  <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-2">
                    {categoryName}
                  </h3>
                  <div className="space-y-1">
                    {sectionsInCategory.map((section) => (
                      <button
                        key={section.id}
                        onClick={() => setActiveSection(section.id)}
                        className={`w-full text-left px-3 py-2 text-sm rounded-lg transition-colors ${
                          activeSection === section.id
                            ? 'bg-blue-100 text-blue-700 border-r-2 border-blue-500'
                            : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                        }`}
                      >
                        {section.title}
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
          </nav>
        </div>

        <div className="flex-1">
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            {currentSection.content}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BagrutHelpDocumentation;