<!-- This needs to be the styilng guide to our Dashbaord page - implement this styling with the same digrams icons and buttons - include everything except the actual naming - keep the original naming of the entities such as in the sidebar and others - only style apply -->


<!-- <!DOCTYPE html>
<html class="light" dir="rtl" lang="he"><head>
<meta charset="utf-8"/>
<meta content="width=device-width, initial-scale=1.0" name="viewport"/>
<title>לוח בקרה קונסרבטוריון - דיאגרמות מתקדמות</title>
<script src="https://cdn.tailwindcss.com?plugins=forms,typography,container-queries"></script>
<link href="https://fonts.googleapis.com" rel="preconnect"/>
<link crossorigin="" href="https://fonts.gstatic.com" rel="preconnect"/>
<link href="https://fonts.googleapis.com/css2?family=Assistant:wght@300;400;500;600;700;800&amp;family=Plus+Jakarta+Sans:wght@400;500;600;700;800&amp;display=swap" rel="stylesheet"/>
<link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&amp;display=swap" rel="stylesheet"/>
<script>
        tailwind.config = {
            darkMode: "class",
            theme: {
                extend: {
                    colors: {
                        primary: "#6366f1",
                        "chart-blue": "#BAE6FD",
                        "chart-yellow": "#FDE047",
                        "chart-purple": "#C7D2FE",
                        "background-light": "#f8fafc",
                        "background-dark": "#0f172a",
                        "sidebar-light": "#ffffff",
                        "sidebar-dark": "#1e293b",
                    },
                    fontFamily: {
                        sans: ["Assistant", "Plus Jakarta Sans", "sans-serif"],
                    },
                    borderRadius: {
                        DEFAULT: "12px",
                        'xl': '18px',
                        '2xl': '24px',
                        '3xl': '32px',
                    },
                },
            },
        };
    </script>
<style type="text/tailwindcss">
        body { font-family: 'Assistant', sans-serif; }
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        .material-symbols-outlined {
            font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24;
        }
        .chart-grid-line {
            stroke: #e2e8f0;
            stroke-dasharray: 4 4;
        }
        .smooth-line {
            fill: none;
            stroke-width: 3;
            stroke-linecap: round;
            stroke-linejoin: round;
        }
    </style>
</head>
<body class="bg-slate-50 dark:bg-background-dark text-slate-900 dark:text-slate-100 transition-colors duration-200">
<div class="flex h-screen overflow-hidden">
<aside class="w-64 bg-sidebar-light dark:bg-sidebar-dark border-l border-slate-200 dark:border-slate-800 flex flex-col shrink-0 z-20">
<div class="p-6 flex items-center gap-3">
<div class="w-10 h-10 bg-primary rounded-xl flex items-center justify-center text-white shadow-lg shadow-primary/30">
<span class="material-symbols-outlined">library_music</span>
</div>
<div>
<h1 class="font-extrabold text-xl tracking-tight">קונסרבטוריון</h1>
<span class="text-[10px] uppercase tracking-widest font-bold text-primary/70">ניהול v1.0</span>
</div>
</div>
<nav class="flex-1 px-4 py-4 space-y-1 overflow-y-auto hide-scrollbar">
<p class="px-3 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2">תפריט ראשי</p>
<a class="flex items-center gap-3 px-3 py-3 rounded-xl bg-primary/10 text-primary font-bold transition-all" href="#">
<span class="material-symbols-outlined text-xl">grid_view</span>
                לוח בקרה
            </a>
<a class="flex items-center gap-3 px-3 py-3 rounded-xl text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all font-medium" href="#">
<span class="material-symbols-outlined text-xl">person</span>
                מורים
            </a>
<a class="flex items-center gap-3 px-3 py-3 rounded-xl text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all font-medium" href="#">
<span class="material-symbols-outlined text-xl">groups</span>
                תלמידים
            </a>
<a class="flex items-center gap-3 px-3 py-3 rounded-xl text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all font-medium" href="#">
<span class="material-symbols-outlined text-xl">fact_check</span>
                נוכחות
            </a>
<a class="flex items-center gap-3 px-3 py-3 rounded-xl text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all font-medium" href="#">
<span class="material-symbols-outlined text-xl">payments</span>
                כספים
            </a>
<a class="flex items-center gap-3 px-3 py-3 rounded-xl text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all font-medium" href="#">
<span class="material-symbols-outlined text-xl">calendar_month</span>
                מערכת שעות
            </a>
<a class="flex items-center gap-3 px-3 py-3 rounded-xl text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all font-medium" href="#">
<span class="material-symbols-outlined text-xl">auto_stories</span>
                ספרייה
            </a>
<p class="px-3 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-8 mb-2">תמיכה</p>
<a class="flex items-center gap-3 px-3 py-3 rounded-xl text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all font-medium" href="#">
<span class="material-symbols-outlined text-xl">settings</span>
                הגדרות
            </a>
<a class="flex items-center gap-3 px-3 py-3 rounded-xl text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all font-medium" href="#">
<span class="material-symbols-outlined text-xl">logout</span>
                התנתקות
            </a>
</nav>
</aside>
<main class="flex-1 flex flex-col min-w-0 overflow-hidden relative">
<header class="h-20 bg-white dark:bg-sidebar-dark border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-8 shrink-0 z-10">
<div class="relative w-96">
<span class="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">search</span>
<input class="w-full bg-slate-100 dark:bg-slate-800 border-none rounded-2xl py-2.5 pr-11 pl-4 focus:ring-2 focus:ring-primary text-sm transition-all text-right" placeholder="חיפוש שיעורים, תלמידים..." type="text"/>
</div>
<div class="flex items-center gap-6">
<button class="relative text-slate-500 hover:text-primary transition-colors">
<span class="material-symbols-outlined">notifications</span>
<span class="absolute top-0 left-0 w-2 h-2 bg-red-500 rounded-full border-2 border-white dark:border-sidebar-dark"></span>
</button>
<div class="h-8 w-px bg-slate-200 dark:bg-slate-700"></div>
<div class="flex items-center gap-3">
<div class="text-left">
<p class="text-sm font-bold">יוסי בן-ארי</p>
<p class="text-[11px] font-semibold text-slate-400 uppercase">מנהל</p>
</div>
<img alt="פרופיל מנהל" class="w-10 h-10 rounded-xl object-cover ring-2 ring-white dark:ring-slate-800" src="https://lh3.googleusercontent.com/aida-public/AB6AXuAQsi1R1f_aD1VlMpemoMY3FEuwRpa3BDTy98YAt2N_jYdzY0Sw6AYhjR7N5ovLpY0gnwk0K6gCiwfGeSf6JlK04qSHBKiy2w_09GqgMLC1lKVd5XxK0oMDzF2yQp-Yn0bfWdGb_0DmBppr1NJYghPKbGgCTRZVyXcmteoYCCuvh6WtcOyoa4OBWJkjYgWFUEOb6lDEANR4M_VwEeNAckdHQkdTtGDLSJa7Q_6O-8L_EgePyIuZjzg2Qu-Dp9cM95EkQc1yHrTAuCZ5"/>
</div>
</div>
</header>
<div class="flex-1 overflow-y-auto p-8 hide-scrollbar">
<div class="grid grid-cols-12 gap-8">
<div class="col-span-12 lg:col-span-9 space-y-8">
<div class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
<div class="bg-indigo-50/50 dark:bg-indigo-900/10 p-6 rounded-3xl border border-indigo-100 dark:border-indigo-800/30">
<div class="flex justify-between items-start mb-4">
<span class="material-symbols-outlined text-indigo-500 text-3xl">groups</span>
<span class="bg-white/80 dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 text-[10px] font-bold px-2 py-1 rounded-lg" dir="ltr">+12%</span>
</div>
<h3 class="text-3xl font-extrabold mb-1">1,248</h3>
<p class="text-sm font-bold text-indigo-600/70 dark:text-indigo-400/70">תלמידים פעילים</p>
</div>
<div class="bg-amber-50/50 dark:bg-amber-900/10 p-6 rounded-3xl border border-amber-100 dark:border-amber-800/30">
<div class="flex justify-between items-start mb-4">
<span class="material-symbols-outlined text-amber-500 text-3xl">school</span>
<span class="bg-white/80 dark:bg-slate-800 text-amber-600 dark:text-amber-400 text-[10px] font-bold px-2 py-1 rounded-lg" dir="ltr">+5%</span>
</div>
<h3 class="text-3xl font-extrabold mb-1">42</h3>
<p class="text-sm font-bold text-amber-600/70 dark:text-amber-400/70">סגל הוראה</p>
</div>
<div class="bg-sky-50/50 dark:bg-sky-900/10 p-6 rounded-3xl border border-sky-100 dark:border-sky-800/30">
<div class="flex justify-between items-start mb-4">
<span class="material-symbols-outlined text-sky-500 text-3xl">piano</span>
<span class="bg-white/80 dark:bg-slate-800 text-sky-600 dark:text-sky-400 text-[10px] font-bold px-2 py-1 rounded-lg">8 פעילים</span>
</div>
<h3 class="text-3xl font-extrabold mb-1">12</h3>
<p class="text-sm font-bold text-sky-600/70 dark:text-sky-400/70">הרכבים פעילים</p>
</div>
<div class="bg-emerald-50/50 dark:bg-emerald-900/10 p-6 rounded-3xl border border-emerald-100 dark:border-emerald-800/30">
<div class="flex justify-between items-start mb-4">
<span class="material-symbols-outlined text-emerald-500 text-3xl">event_available</span>
<span class="bg-white/80 dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold px-2 py-1 rounded-lg">גבוה</span>
</div>
<h3 class="text-3xl font-extrabold mb-1">480</h3>
<p class="text-sm font-bold text-emerald-600/70 dark:text-emerald-400/70">חזרות שבועיות</p>
</div>
</div>
<div class="bg-white dark:bg-sidebar-dark p-8 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800">
<div class="flex justify-between items-center mb-8">
<h2 class="text-xl font-bold">מגמות פיננסיות</h2>
<div class="flex items-center gap-6">
<div class="flex items-center gap-2">
<div class="w-2 h-2 rounded-full bg-chart-blue"></div>
<span class="text-xs font-semibold text-slate-500">הכנסות</span>
</div>
<div class="flex items-center gap-2">
<div class="w-2 h-2 rounded-full bg-chart-purple"></div>
<span class="text-xs font-semibold text-slate-500">הוצאות</span>
</div>
<button class="material-symbols-outlined text-slate-400">more_horiz</button>
</div>
</div>
<div class="relative h-64 w-full">
<svg class="w-full h-full overflow-visible" preserveAspectRatio="none" viewBox="0 0 1000 200">
<line class="chart-grid-line" stroke-width="1" x1="0" x2="1000" y1="0" y2="0"></line>
<line class="chart-grid-line" stroke-width="1" x1="0" x2="1000" y1="50" y2="50"></line>
<line class="chart-grid-line" stroke-width="1" x1="0" x2="1000" y1="100" y2="100"></line>
<line class="chart-grid-line" stroke-width="1" x1="0" x2="1000" y1="150" y2="150"></line>
<line class="chart-grid-line" stroke-width="1" x1="0" x2="1000" y1="200" y2="200"></line>
<rect fill="#6366f1" fill-opacity="0.05" height="200" width="80" x="750" y="0"></rect>
<path class="smooth-line stroke-chart-blue" d="M0,120 C100,60 200,100 300,70 C400,140 500,120 600,60 C700,80 800,40 900,50 L1000,30"></path>
<path class="smooth-line stroke-chart-purple" d="M0,150 C100,110 200,130 300,120 C400,160 500,150 600,110 C700,130 800,100 900,120 L1000,100"></path>
<circle cx="535" cy="118" fill="white" r="4" stroke="#6366f1" stroke-width="2"></circle>
</svg>
<div class="absolute left-1/2 top-10 -translate-x-1/2 bg-white dark:bg-slate-800 shadow-xl border border-slate-100 dark:border-slate-700 rounded-2xl p-4 z-10 w-40">
<p class="text-[10px] font-bold text-slate-400 mb-2">14 בספטמבר, 2030</p>
<div class="space-y-2">
<div class="flex justify-between items-center">
<div class="flex items-center gap-2">
<div class="w-1.5 h-1.5 rounded-full bg-chart-blue"></div>
<span class="text-[11px] font-bold">₪837,000</span>
</div>
</div>
<div class="flex justify-between items-center">
<div class="flex items-center gap-2">
<div class="w-1.5 h-1.5 rounded-full bg-chart-purple"></div>
<span class="text-[11px] font-bold">₪600,000</span>
</div>
</div>
</div>
</div>
<div class="flex justify-between mt-6 px-1">
<span class="text-[10px] font-bold text-slate-400">ינו'</span>
<span class="text-[10px] font-bold text-slate-400">פבר'</span>
<span class="text-[10px] font-bold text-slate-400">מרץ</span>
<span class="text-[10px] font-bold text-slate-400">אפר'</span>
<span class="text-[10px] font-bold text-slate-400">מאי</span>
<span class="text-[10px] font-bold text-slate-400">יוני</span>
<span class="text-[10px] font-bold text-slate-400">יולי</span>
<span class="text-[10px] font-bold text-slate-400">אוג'</span>
<span class="text-[10px] font-bold text-slate-400 text-primary">ספט'</span>
<span class="text-[10px] font-bold text-slate-400">אוק'</span>
<span class="text-[10px] font-bold text-slate-400">נוב'</span>
<span class="text-[10px] font-bold text-slate-400">דצמ'</span>
</div>
</div>
</div>
<div class="grid grid-cols-1 xl:grid-cols-2 gap-8">
<div class="bg-white dark:bg-sidebar-dark p-8 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800">
<div class="flex justify-between items-center mb-8">
<h2 class="text-xl font-bold">נוכחות</h2>
<div class="flex gap-4">
<div class="flex items-center gap-1.5">
<div class="w-2 h-2 rounded-full bg-chart-yellow"></div>
<span class="text-[10px] font-bold text-slate-400">נוכחים</span>
</div>
<div class="flex items-center gap-1.5">
<div class="w-2 h-2 rounded-full bg-chart-blue"></div>
<span class="text-[10px] font-bold text-slate-400">נעדרים</span>
</div>
</div>
</div>
<div class="relative flex items-end justify-between h-48 gap-8 px-4">
<div class="absolute right-[45%] top-10 bg-white dark:bg-slate-800 shadow-lg rounded-xl p-2 px-3 border border-slate-50 dark:border-slate-700 text-center z-10">
<p class="text-xs font-bold">95%</p>
<p class="text-[9px] text-slate-400">נוכחים</p>
<div class="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-white dark:bg-slate-800 rotate-45 border-r border-b border-slate-50 dark:border-slate-700"></div>
</div>
<div class="flex flex-col items-center gap-3 w-full">
<div class="flex items-end gap-1.5 h-full w-full">
<div class="w-2 bg-chart-yellow rounded-full" style="height: 65%"></div>
<div class="w-2 bg-chart-blue rounded-full" style="height: 55%"></div>
</div>
<span class="text-[10px] font-bold text-slate-400">א'</span>
</div>
<div class="flex flex-col items-center gap-3 w-full">
<div class="flex items-end gap-1.5 h-full w-full">
<div class="w-2 bg-chart-yellow rounded-full" style="height: 75%"></div>
<div class="w-2 bg-chart-blue rounded-full" style="height: 60%"></div>
</div>
<span class="text-[10px] font-bold text-slate-400">ב'</span>
</div>
<div class="flex flex-col items-center gap-3 w-full">
<div class="flex items-end gap-1.5 h-full w-full">
<div class="w-2 bg-chart-yellow rounded-full" style="height: 90%"></div>
<div class="w-2 bg-chart-blue rounded-full" style="height: 70%"></div>
</div>
<span class="text-[10px] font-bold text-slate-400">ג'</span>
</div>
<div class="flex flex-col items-center gap-3 w-full">
<div class="flex items-end gap-1.5 h-full w-full">
<div class="w-2 bg-chart-yellow rounded-full" style="height: 70%"></div>
<div class="w-2 bg-chart-blue rounded-full" style="height: 80%"></div>
</div>
<span class="text-[10px] font-bold text-slate-400">ד'</span>
</div>
<div class="flex flex-col items-center gap-3 w-full">
<div class="flex items-end gap-1.5 h-full w-full">
<div class="w-2 bg-chart-yellow rounded-full" style="height: 75%"></div>
<div class="w-2 bg-chart-blue rounded-full" style="height: 65%"></div>
</div>
<span class="text-[10px] font-bold text-slate-400">ה'</span>
</div>
</div>
</div>
<div class="bg-white dark:bg-sidebar-dark p-8 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800">
<div class="flex justify-between items-center mb-6">
<h2 class="text-xl font-bold">תלמידים</h2>
<button class="material-symbols-outlined text-slate-400">more_horiz</button>
</div>
<div class="flex flex-col items-center">
<div class="relative w-48 h-48 mb-8">
<svg class="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
<circle cx="18" cy="18" fill="transparent" r="15.915" stroke="#f1f5f9" stroke-width="2.5"></circle>
<circle cx="18" cy="18" fill="transparent" r="15.915" stroke="#BAE6FD" stroke-dasharray="47 53" stroke-dashoffset="0" stroke-linecap="round" stroke-width="2.5"></circle>
<circle cx="18" cy="18" fill="transparent" r="11" stroke="#f1f5f9" stroke-width="2.5"></circle>
<circle cx="18" cy="18" fill="transparent" r="11" stroke="#FDE047" stroke-dasharray="53 47" stroke-dashoffset="-47" stroke-linecap="round" stroke-width="2.5"></circle>
</svg>
<div class="absolute inset-0 flex items-center justify-center gap-2">
<span class="material-symbols-outlined text-sky-300 text-3xl">man</span>
<span class="material-symbols-outlined text-amber-300 text-3xl">woman</span>
</div>
</div>
<div class="grid grid-cols-2 gap-12 w-full px-4">
<div class="text-right">
<div class="flex items-center gap-2 mb-1">
<div class="w-3 h-3 rounded-full bg-chart-blue"></div>
<span class="text-lg font-extrabold leading-none">45,414</span>
</div>
<p class="text-[11px] font-bold text-slate-400">בנים (47%)</p>
</div>
<div class="text-right">
<div class="flex items-center gap-2 mb-1">
<div class="w-3 h-3 rounded-full bg-chart-yellow"></div>
<span class="text-lg font-extrabold leading-none">40,270</span>
</div>
<p class="text-[11px] font-bold text-slate-400">בנות (53%)</p>
</div>
</div>
</div>
</div>
</div>
<div class="bg-white dark:bg-sidebar-dark rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800 overflow-hidden">
<div class="p-8 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
<h2 class="text-xl font-bold">ביצועי מורים</h2>
<button class="text-primary text-sm font-bold hover:underline">הצג הכל</button>
</div>
<div class="overflow-x-auto">
<table class="w-full text-right">
<thead class="bg-slate-50/50 dark:bg-slate-800/30">
<tr>
<th class="px-8 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">מורה</th>
<th class="px-8 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">מחלקה</th>
<th class="px-8 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center">תלמידים</th>
<th class="px-8 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">דירוג</th>
<th class="px-8 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">סטטוס</th>
</tr>
</thead>
<tbody class="divide-y divide-slate-100 dark:divide-slate-800">
<tr class="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors">
<td class="px-8 py-4">
<div class="flex items-center gap-3">
<img class="w-10 h-10 rounded-xl object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuAbA7QwF8wXq9Nx_5nqML3gbb5zm3Z41Y_bDD3wBbR8toecxTEqHOkh93p6xm3wugrZbmqGSB08NXcEUnvBGR2IvRwgByOzqKGOKPXfcU3nTATpDksX169IyZaO56VwldxQYV2R71t6L5xSl6CMbNqJ9I11HPvPCclgL7Zn8mh6wULIhy5sfJNPJbYlf65WPF7FApZKu9DQxx6dgF-jIUgH9x78fBBNzbT3wyq4hpWbK95Mgn8ntmugyVNiZssJhm4rpGg6NmcFXRE-"/>
<span class="text-sm font-bold">אלנה ואנס</span>
</div>
</td>
<td class="px-8 py-4 text-sm text-slate-500 font-medium">כינור</td>
<td class="px-8 py-4 text-sm font-bold text-center">28</td>
<td class="px-8 py-4">
<div class="flex items-center gap-1 text-amber-400">
<span class="material-symbols-outlined text-base">star</span>
<span class="text-sm font-bold text-slate-900 dark:text-slate-100">4.9</span>
</div>
</td>
<td class="px-8 py-4">
<span class="px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold">פעיל</span>
</td>
</tr>
<tr class="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors">
<td class="px-8 py-4">
<div class="flex items-center gap-3">
<img class="w-10 h-10 rounded-xl object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuBC7AgTeOZYC1XUTG1yHPXywPCB3Q1b3OKH-rRKf2DwQehCj2OBJcTbp0qiJ7dHKtIm2MKOJHjXaxJ5fb3ZpZXd5rF_SPX7KZXHg0JRQhzr_1Zb3WgI6LKXhzXSXqX2AuRYkwNuTJamaWoPzjh7ZPpfWsPgpMHvfbThPV4FKNwz_1Inyzokd1WoTk5kqYvkQlnCyKXiTZS3pO3NVG9PyQ-LGl_CCWYEq0pgIw9G2Mjb5FdwmnoodOkDWSib131b4__PrPOayolOKZqt"/>
<span class="text-sm font-bold">מרכוס ת'ורן</span>
</div>
</td>
<td class="px-8 py-4 text-sm text-slate-500 font-medium">פסנתר קלאסי</td>
<td class="px-8 py-4 text-sm font-bold text-center">34</td>
<td class="px-8 py-4">
<div class="flex items-center gap-1 text-amber-400">
<span class="material-symbols-outlined text-base">star</span>
<span class="text-sm font-bold text-slate-900 dark:text-slate-100">4.8</span>
</div>
</td>
<td class="px-8 py-4">
<span class="px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold">פעיל</span>
</td>
</tr>
</tbody>
</table>
</div>
</div>
</div>
<div class="col-span-12 lg:col-span-3 space-y-8">
<div class="bg-white dark:bg-sidebar-dark p-6 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800">
<div class="flex items-center justify-between mb-6">
<button class="material-symbols-outlined text-slate-400 hover:text-primary transition-colors text-lg">chevron_right</button>
<h3 class="font-bold text-sm">ספטמבר 2030</h3>
<button class="material-symbols-outlined text-slate-400 hover:text-primary transition-colors text-lg">chevron_left</button>
</div>
<div class="grid grid-cols-7 gap-1 text-center">
<span class="text-[10px] font-bold text-slate-400 uppercase mb-2">א</span>
<span class="text-[10px] font-bold text-slate-400 uppercase mb-2">ב</span>
<span class="text-[10px] font-bold text-slate-400 uppercase mb-2">ג</span>
<span class="text-[10px] font-bold text-slate-400 uppercase mb-2">ד</span>
<span class="text-[10px] font-bold text-slate-400 uppercase mb-2">ה</span>
<span class="text-[10px] font-bold text-slate-400 uppercase mb-2">ו</span>
<span class="text-[10px] font-bold text-slate-400 uppercase mb-2">ש</span>
<span class="p-2 text-xs font-semibold text-slate-400">19</span>
<span class="p-2 text-xs font-semibold text-slate-400">20</span>
<span class="p-2 text-xs font-semibold text-slate-400">21</span>
<span class="p-2 text-xs font-bold bg-primary text-white rounded-xl shadow-md shadow-primary/20">22</span>
<span class="p-2 text-xs font-semibold">23</span>
<span class="p-2 text-xs font-semibold">24</span>
<span class="p-2 text-xs font-semibold">25</span>
</div>
</div>
<div class="bg-white dark:bg-sidebar-dark p-6 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800">
<div class="flex justify-between items-center mb-6">
<h3 class="font-bold">סדר יום</h3>
<button class="material-symbols-outlined text-slate-400 text-lg">more_horiz</button>
</div>
<div class="space-y-4">
<div class="bg-indigo-50/50 dark:bg-indigo-900/10 p-4 rounded-2xl border border-indigo-100/50 dark:border-indigo-800/20">
<div class="flex justify-between items-start mb-2">
<span class="text-[10px] font-bold text-indigo-500">09:00</span>
<span class="text-[9px] font-bold bg-white dark:bg-slate-800 px-1.5 py-0.5 rounded shadow-sm">כל השכבות</span>
</div>
<h4 class="text-sm font-bold text-indigo-900 dark:text-indigo-100 mb-1">חזרת הרכב ג'אז</h4>
<p class="text-[11px] text-indigo-600/70 dark:text-indigo-400">חדר 304 • פרופ' דייוויס</p>
</div>
<div class="bg-amber-50/50 dark:bg-amber-900/10 p-4 rounded-2xl border border-amber-100/50 dark:border-amber-800/20">
<div class="flex justify-between items-start mb-2">
<span class="text-[10px] font-bold text-amber-500">11:30</span>
<span class="text-[9px] font-bold bg-white dark:bg-slate-800 px-1.5 py-0.5 rounded shadow-sm">שכבה ג'-ה'</span>
</div>
<h4 class="text-sm font-bold text-amber-900 dark:text-amber-100 mb-1">תיאוריה 101</h4>
<p class="text-[11px] text-amber-600/70 dark:text-amber-400">אודיטוריום ב' • ד"ר מילר</p>
</div>
<div class="bg-sky-50/50 dark:bg-sky-900/10 p-4 rounded-2xl border border-sky-100/50 dark:border-sky-800/20">
<div class="flex justify-between items-start mb-2">
<span class="text-[10px] font-bold text-sky-500">14:00</span>
<span class="text-[9px] font-bold bg-white dark:bg-slate-800 px-1.5 py-0.5 rounded shadow-sm">שכבה ו'-ח'</span>
</div>
<h4 class="text-sm font-bold text-sky-900 dark:text-sky-100 mb-1">רסיטל פסנתר סולו</h4>
<p class="text-[11px] text-sky-600/70 dark:text-sky-400">אולם הקונצרטים המרכזי</p>
</div>
</div>
</div>
<div class="bg-white dark:bg-sidebar-dark p-6 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800">
<div class="flex justify-between items-center mb-6">
<h3 class="font-bold">הודעות</h3>
<button class="text-primary text-[11px] font-bold uppercase">הצג הכל</button>
</div>
<div class="space-y-6">
<div class="flex gap-3">
<img class="w-10 h-10 rounded-xl object-cover shrink-0" src="https://lh3.googleusercontent.com/aida-public/AB6AXuAyPuPU6G3oBKq2jJe-vsz3h37r-2ZzmYe5QNtHpxZ7cpcPGH4MVoMW1EoF2sgBeFXrciHWzRVqbFOCm2bTUrqepOnKjev6GJX53IfGRMiXeMHnZKSsnS4l0tExtosbb50rnZbAbHtNVJ7Ba7maUbgy3t11njnKGID3zHZiG6i3ym6B0_dCXzJIXv__kHTCsl7yTRsPLYgawrAVoLQNn_Vx9gZZWCYvHOpxNCXNYTUNl5iIbz8cA0u8PiYZyq9rRI-nVaXR_i1XwJFL"/>
<div class="min-w-0 flex-1">
<div class="flex justify-between items-start mb-0.5">
<h4 class="text-xs font-bold truncate">שרה ג'ונסון</h4>
<span class="text-[9px] text-slate-400 shrink-0">לפני 2 דק'</span>
</div>
<p class="text-[11px] text-slate-500 line-clamp-2">התווים להרכב הצ'לו עודכנו בספרייה.</p>
</div>
</div>
<div class="flex gap-3">
<img class="w-10 h-10 rounded-xl object-cover shrink-0" src="https://lh3.googleusercontent.com/aida-public/AB6AXuBmfxgzQxpQy5Z1dCLy981WsR4huUWsC4_5ravv7WquHnzQ8aDHBT9KAdU65LvIDcOC3aUnzzDM9EPgvTySnLNFwbLrVjVFt71fudw_x23dpG-YQXfwPJ3hrZZlQ5jkwVdXwIyFKCrRzIfNGmJPZfer7h5Eb-968byU-aUwgBSv4awgItFjgsA0fzpLSq-dc4uzod6a2XaHYskJnO0OeYGyoNC9o2jDVuxsHsI-5NRcS-NxuPP0Jc4HKP4BxYrTi_5zLEAbH-nhHQ5o"/>
<div class="min-w-0 flex-1">
<div class="flex justify-between items-start mb-0.5">
<h4 class="text-xs font-bold truncate">דוד חן</h4>
<span class="text-[9px] text-slate-400 shrink-0">לפני שעה</span>
</div>
<p class="text-[11px] text-slate-500 line-clamp-2">נוכל לדחות את ישיבת הסגל?</p>
</div>
</div>
</div>
</div>
</div>
</div>
</div>
</main>
</div>
<button class="fixed bottom-6 left-6 w-12 h-12 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-full shadow-2xl flex items-center justify-center hover:scale-110 transition-transform z-50" onclick="document.documentElement.classList.toggle('dark')">
<span class="material-symbols-outlined text-primary dark:text-amber-400">dark_mode</span>
</button>

</body></html> -->