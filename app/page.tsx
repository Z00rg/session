"use client";

import {
  useState,
  useEffect,
  useRef,
  useCallback,
  type MouseEvent as ReactMouseEvent,
} from "react";

/* ============================================================
   Конструктор ИИ-трансформации СамГМУ — Модуль 2 (группа «Образование»)
   Один самодостаточный клиентский компонент: 5 шагов, всё редактируется,
   состояние сохраняется в localStorage. Стили инъектируются ниже, поэтому
   компонент не зависит от конфигурации Tailwind проекта.
   ============================================================ */

// ---------- Типы ----------
interface Module {
  id: string;
  name: string;
  desc: string;
  tz?: string;
  horizon?: "now" | "future"; // сейчас / в перспективе
  sourcing?: "self" | "integrate"; // своя разработка / интеграция
  tier?: "core" | "optional"; // основное / дополнительное
  link?: string; // источник информации об интеграции
  level?: string; // явный слой схемы (ручное распределение)
}
interface ChecklistItem {
  id: string;
  text: string;
  checked: boolean;
}
interface Project {
  id: string;
  name: string;
  activities: string;
  kpi: string;
  type: "quick" | "strategic";
  startQuarter: number;
  duration: number;
}
interface SchemaLevel {
  id: string;
  title: string;
  moduleIds: string[];
}
interface AppState {
  step: number;
  direction: string;
  scenario: string;
  initiative: string;
  modules: Module[]; // сгенерированные + пользовательские
  selectedIds: string[];
  levels: SchemaLevel[];
  resources: ChecklistItem[];
  actions: ChecklistItem[];
  projects: Project[];
  theme: "dark" | "light";
}

// ---------- Справочники ----------
const directionsMap: Record<
    string,
    { name: string; prep: string; domain: string; spec: string[] }
> = {
  education: {
    name: "образования",
    prep: "в университете",
    domain: "учебный процесс",
    spec: [
      "Адаптивный тьютор",
      "Граф компетенций",
      "Автоматическая проверка работ",
      "Анализ успеваемости",
    ],
  },
  science: {
    name: "науки",
    prep: "в научных исследованиях",
    domain: "R&D",
    spec: [
      "AlphaFold-подобная модель",
      "Замкнутый R&D конвейер",
      "Геномная языковая модель",
      "Виртуальный скрининг",
    ],
  },
  clinic: {
    name: "клиники",
    prep: "в клинической практике",
    domain: "диагностика и лечение",
    spec: [
      "Диагностика КТ/МРТ с ИИ",
      "Прогнозирование сепсиса",
      "Клинический copilot",
      "Голосовое заполнение карт",
    ],
  },
  production: {
    name: "производства",
    prep: "на производстве",
    domain: "выпуск медизделий",
    spec: [
      "Визуальный контроль качества",
      "Предиктивное обслуживание станков",
      "Генеративный дизайн имплантов",
      "Цифровой двойник цеха",
    ],
  },
  services: {
    name: "управления",
    prep: "в административной деятельности",
    domain: "бизнес-процессы",
    spec: [
      "Агент планирования бюджета",
      "HR-аналитика",
      "ИИ-документооборот",
      "Умная логистика",
    ],
  },
};

const scenarioMap: Record<string, { label: string; focus: string }> = {
  integrator_to_hub: {
    label: "От умного интегратора к национальному хабу",
    focus:
        "поэтапно: бесшовная интеграция и сквозные процессы → масштабирование, экспорт решений и лидерство",
  },
  digital_fortress: {
    label: "Цифровая крепость",
    focus: "безопасность, защита данных, импортозамещение",
  },
  smart_integrator: {
    label: "Умный интегратор",
    focus: "бесшовная интеграция, API-экономика, сквозные процессы",
  },
  tech_sovereign: {
    label: "Технологический суверен",
    focus: "собственные LLM, компьютерное зрение, R&D",
  },
  national_hub: {
    label: "Национальный хаб",
    focus: "масштабирование, экспорт решений, лидерство",
  },
};

const QUARTERS = [
  "1п 2026",
  "2п 2026",
  "1п 2027",
  "2п 2027",
  "1п 2028",
  "2п 2028",
  "1п 2029",
  "2п 2029",
  "1п 2030",
  "2п 2030",
  "1п 2031",
  "2п 2031",
];
const QUARTER_WIDTH = 80;
const STORAGE_KEY = "samgmu_ai_module2_v1";

const LEVEL_NAMES = [
  "Ядро",
  "Мультиагентный слой",
  "Аналитика и прогнозирование",
  "Интеграция и интерфейсы",
  "Пользователи и новые роли",
  "Продукт",
  "Бизнес-модель",
];

const uid = () =>
    Date.now().toString(36) + Math.random().toString(36).slice(2, 7);

// ---------- Генерация элементов образа будущего ----------
function generateModules(
    direction: string,
    scenario: string,
    initiative: string
): Module[] {
  const dir = directionsMap[direction] || directionsMap.education;
  const modules: Module[] = [];

  for (const spec of dir.spec)
    modules.push({
      id: `spec_${direction}_${spec.replace(/\s/g, "")}`,
      name: spec,
      desc: `Специализированное решение для ${dir.name}, автоматизирующее ключевые процессы.`,
    });

  if (direction === "education")
    for (const m of EDUCATION_SEED) modules.push({ ...m });

  const templates = [
    "ИИ-агент для автоматизации рутины",
    "Предиктивная аналитика",
    "Интеллектуальный помощник на базе LLM",
    "Граф знаний",
    "Компьютерное зрение",
    "Генеративный дизайн",
    "Мультиагентная оркестрация",
    "Цифровой двойник",
    "Рекомендательная система",
    "Обработка NLP",
    "Автоматическая генерация контента",
    "Риск-стратификация",
    "Виртуальный ассистент",
    "Предиктивное обслуживание",
    "BI-аналитика",
    "Голосовое управление",
    "Платформа совместной работы",
    "Агент планирования",
    "Контроль качества с CV",
    "Умный документооборот",
    "Человек в контуре",
    "Симулятор сложных ситуаций",
  ];
  templates.forEach((t, i) =>
      modules.push({
        id: `gen_${direction}_${i}`,
        name: `${t} ${dir.prep}`,
        desc: `Модуль для ${dir.name}, повышает эффективность.`,
      })
  );

  if (scenario === "digital_fortress")
    modules.push({
      id: "sc_fortress",
      name: "Система ИИ-безопасности и мониторинга инцидентов",
      desc: "Обнаружение аномалий, защита моделей, аудит решений.",
    });
  if (scenario === "smart_integrator")
    modules.push({
      id: "sc_integrator",
      name: "Единая шина интеграции ИИ-сервисов (API Gateway)",
      desc: "Оркестрация вызовов, маршрутизация, кэширование.",
    });
  if (scenario === "tech_sovereign")
    modules.push({
      id: "sc_sovereign",
      name: "Фабрика собственных LLM и CV-моделей",
      desc: "Обучение и дообучение на отраслевых данных.",
    });
  if (scenario === "national_hub" || scenario === "integrator_to_hub")
    modules.push({
      id: "sc_hub",
      name: "Платформа тиражирования ИИ-решений для медорганизаций",
      desc: "Магазин моделей, лицензирование, удалённое развёртывание.",
      level: "Продукт",
    });
  if (scenario === "smart_integrator" || scenario === "integrator_to_hub")
    modules.push({
      id: "sc_integrator",
      name: "Единая шина интеграции ИИ-сервисов (API Gateway)",
      desc: "Оркестрация вызовов, маршрутизация, кэширование.",
      level: "Интеграция и интерфейсы",
    });

  if (initiative && initiative.trim() !== "") {
    const t = initiative.toLowerCase();
    if (
        t.includes("диагностик") ||
        t.includes("клиник") ||
        t.includes("врач") ||
        t.includes("лечени")
    ) {
      modules.push({
        id: "init_diag",
        name: "Система поддержки клинических решений",
        desc: "Помощь врачам в диагностике и выборе тактики лечения на основе ИИ.",
      });
      modules.push({
        id: "init_anal",
        name: "Медицинская аналитическая платформа",
        desc: "Анализ историй болезней, выявление паттернов и рисков.",
      });
    }
    if (
        t.includes("образован") ||
        t.includes("учебн") ||
        t.includes("студент") ||
        t.includes("курс") ||
        t.includes("обучени")
    ) {
      modules.push({
        id: "init_edu",
        name: "Адаптивная образовательная среда",
        desc: "Персонализация траекторий обучения на основе успеваемости и интересов.",
      });
      modules.push({
        id: "init_sim",
        name: "Виртуальный тренажёр для отработки навыков",
        desc: "Симуляция реальных ситуаций для студентов и сотрудников.",
      });
    }
    if (
        t.includes("производств") ||
        t.includes("станк") ||
        t.includes("качеств") ||
        t.includes("брак")
    ) {
      modules.push({
        id: "init_qual",
        name: "Интеллектуальный контроль качества",
        desc: "Автоматическое обнаружение дефектов продукции с помощью компьютерного зрения.",
      });
      modules.push({
        id: "init_pred",
        name: "Предиктивная аналитика оборудования",
        desc: "Прогнозирование отказов и оптимизация ТО.",
      });
    }
    if (
        t.includes("бюджет") ||
        t.includes("логистик") ||
        t.includes("закупк") ||
        t.includes("документ")
    ) {
      modules.push({
        id: "init_budget",
        name: "ИИ-агент планирования ресурсов",
        desc: "Автоматизация бюджетных процессов и логистики.",
      });
      modules.push({
        id: "init_doc",
        name: "Умный документооборот",
        desc: "Классификация, извлечение данных и маршрутизация документов.",
      });
    }
    if (
        t.includes("наук") ||
        t.includes("исследован") ||
        t.includes("r&d") ||
        t.includes("лаборатор")
    ) {
      modules.push({
        id: "init_sci",
        name: "Научный ассистент на основе LLM",
        desc: "Анализ литературы, генерация гипотез, автоматизация экспериментов.",
      });
    }
    modules.push({
      id: "init_dash",
      name: "Система мониторинга KPI инициативы",
      desc: "Дашборды для отслеживания прогресса ключевой инициативы.",
    });
    modules.push({
      id: "init_orch",
      name: "Оркестратор процессов инициативы",
      desc: "Координация работ и ресурсов в рамках флагманского проекта.",
    });
  }

  const unique = new Map<string, Module>();
  for (const m of modules) if (!unique.has(m.id)) unique.set(m.id, m);
  const finalModules = Array.from(unique.values());
  while (finalModules.length < 22)
    finalModules.push({
      id: `extra_${uid()}`,
      name: `Интеграционный модуль ${dir.name}`,
      desc: `Гибкое решение для задач ${dir.name}.`,
    });
  return finalModules;
}

// ---------- Распределение по слоям (роутинг по ключевым словам) ----------
function levelForModule(m: Module): string {
  const txt = (m.name + " " + m.desc).toLowerCase();
  if (
      txt.includes("агент") ||
      txt.includes("ассистент") ||
      txt.includes("тьютор") ||
      txt.includes("copilot")
  )
    return "Мультиагентный слой";
  if (
      txt.includes("аналитик") ||
      txt.includes("прогноз") ||
      txt.includes("bi") ||
      txt.includes("предиктивн") ||
      txt.includes("риск")
  )
    return "Аналитика и прогнозирование";
  if (
      txt.includes("интеграц") ||
      txt.includes("api") ||
      txt.includes("интерфейс") ||
      txt.includes("портал")
  )
    return "Интеграция и интерфейсы";
  if (
      txt.includes("продукт") ||
      txt.includes("услуг") ||
      txt.includes("сервис") ||
      txt.includes("тиражир") ||
      txt.includes("двойник") ||
      txt.includes("магазин") ||
      txt.includes("лицензир") ||
      txt.includes("saas") ||
      txt.includes("маркетплейс") ||
      txt.includes("коммерциализ")
  )
    return "Продукт";
  if (
      txt.includes("пользовател") ||
      txt.includes("роль") ||
      txt.includes("сотрудник") ||
      txt.includes("врач") ||
      txt.includes("студент")
  )
    return "Пользователи и новые роли";
  if (
      txt.includes("бизнес") ||
      txt.includes("kpi") ||
      txt.includes("эффективн") ||
      txt.includes("окупаемост")
  )
    return "Бизнес-модель";
  return "Ядро";
}

function buildLevels(
    selected: Module[],
    prev?: SchemaLevel[]
): SchemaLevel[] {
  // Сохраняем ручные перестановки: если модуль уже размещён — оставляем его уровень.
  const placed = new Map<string, string>();
  prev?.forEach((lvl) =>
      lvl.moduleIds.forEach((mid) => placed.set(mid, lvl.title))
  );

  const base: SchemaLevel[] =
      prev && prev.length
          ? prev.map((l) => ({ ...l, moduleIds: [] }))
          : LEVEL_NAMES.map((title) => ({ id: uid(), title, moduleIds: [] }));

  const byTitle = new Map(base.map((l) => [l.title, l]));

  for (const m of selected) {
    const target = placed.get(m.id) || m.level || levelForModule(m);
    const lvl = byTitle.get(target) || base[0];
    lvl.moduleIds.push(m.id);
  }
  return base;
}

function deriveTechStack(selected: Module[]): string[] {
  const txt = selected.map((m) => (m.name + " " + m.desc).toLowerCase()).join(" ");
  const stack = new Set<string>(["MLOps", "Облачная инфраструктура"]);
  if (txt.includes("llm") || txt.includes("помощник") || txt.includes("nlp") || txt.includes("ассистент"))
    stack.add("LLM / NLP");
  if (txt.includes("зрени") || txt.includes("cv") || txt.includes("изображ"))
    stack.add("Компьютерное зрение");
  if (txt.includes("прогноз") || txt.includes("аналитик") || txt.includes("предиктив"))
    stack.add("Предиктивная аналитика");
  if (txt.includes("граф")) stack.add("Графовые базы знаний");
  if (txt.includes("агент") || txt.includes("оркестр"))
    stack.add("Мультиагентная оркестрация");
  if (txt.includes("двойник")) stack.add("Цифровые двойники");
  return Array.from(stack);
}

// ---------- Чек-листы ----------
function generateChecklists(
    selected: Module[],
    direction: string,
    scenario: string,
    initiative: string
): { resources: ChecklistItem[]; actions: ChecklistItem[] } {
  type CI = [string, boolean]; // [текст, отмечено = уже есть/сделано]
  const baseResources: CI[] = [
    ["Выделенный GPU-кластер или облачные вычислительные мощности", true],
    ["Интегрированное хранилище данных (Data Lake / Lakehouse)", false],
    ["Лицензионное ПО для разработки и развёртывания ИИ-моделей", true],
    ["Команда Data Scientist и ML-инженеров (не менее 3 специалистов)", true],
    ["Политики управления данными и соответствия регуляторным требованиям", true],
    ["Размеченные отраслевые датасеты (медицинские, образовательные и пр.)", false],
    ["Инфраструктура MLOps (мониторинг, версионирование, CI/CD для моделей)", false],
    ["Защищённая среда для обработки персональных данных", true],
    ["Бюджет на пилотные внедрения и масштабирование", false],
    ["Система мониторинга дрейфа моделей и качества предсказаний", false],
    ["Партнёрские соглашения с технологическими вендорами", true],
    ["Методологическая база для оценки экономической эффективности ИИ", false],
    ["Интеграционные шины для связи с системами (ERP, LMS, МИС)", false],
    ["Система управления инцидентами и обратной связью по ИИ", false],
  ];
  const baseActions: CI[] = [
    ["Провести аудит текущего ИТ-ландшафта и качества данных", true],
    ["Разработать регламенты взаимодействия ИИ-агентов с сотрудниками", false],
    ["Обучить профильных специалистов работе с ИИ-инструментами", true],
    ["Сформировать центр компетенций по ИИ и аналитике данных", true],
    ["Разработать и внедрить стандарты качества и полноты данных", false],
    ["Провести пилотные испытания на изолированном контуре", false],
    ["Создать дорожную карту ИИ-проектов и рассчитать ROI", true],
    ["Интегрировать ИИ-модули с корпоративными системами (МИС, LMS, ERP)", false],
    ["Разработать политики кибербезопасности для ИИ-систем", false],
    ["Настроить непрерывный сбор обратной связи от пользователей", false],
    ["Организовать регулярную переподготовку моделей на новых данных", false],
    ["Подготовить план масштабирования успешных пилотов", false],
    ["Внедрить этическую экспертизу ИИ-решений в критических процессах", false],
    ["Создать систему управления знаниями на графовых базах данных", false],
  ];

  const eduResources: CI[] =
      direction === "education"
          ? [
            ["Подсистема этического контроля и политика использования ИИ", false],
            ["Единый ИИ-ландшафт: интеллектуальное ядро + реестр агентов (Agent Hub)", false],
            ["Data Lake верифицированных данных в стандартах FHIR/HL7", false],
            ["Верифицированные образовательные датасеты для дообучения моделей", false],
            ["Защищённый контур обработки ПДн (152-ФЗ, врачебная тайна)", true],
            ["Программа аккредитации ППС по ИИ-компетенциям", true],
          ]
          : [];
  const eduActions: CI[] =
      direction === "education"
          ? [
            ["Создать рабочую группу по внедрению ИИ и провести аудит данных/агентов", true],
            ["Запустить пилот: нейропомощник абитуриента или персональный агент сопровождения", false],
            ["Актуализировать образовательные программы с ИИ-элементами (30% → 70%)", false],
            ["Масштабировать персональных ИИ-агентов на 100% обучающихся", false],
            ["Запустить модуль трекинга ИИ-активности ППС с интеграцией в KPI", false],
            ["Провести массовую аккредитацию ППС по ИИ-компетенциям (цель 100%)", false],
          ]
          : [];
  const resources: CI[] = [...eduResources, ...baseResources];
  const actions: CI[] = [...eduActions, ...baseActions];
  const texts = selected
      .map((m) => (m.name + " " + m.desc).toLowerCase())
      .join(" ");

  if (texts.includes("зрени") || direction === "clinic") {
    resources.push(["Размеченные медицинские изображения (КТ, МРТ, рентген)", false]);
    actions.push(["Провести разметку не менее 10 000 изображений с экспертами", false]);
  }
  if (texts.includes("агент") || texts.includes("ассистент")) {
    resources.push(["Платформа для оркестрации мультиагентных систем", false]);
    actions.push(["Разработать регламенты совместной работы человека и ИИ-агентов", false]);
  }
  if (scenario === "digital_fortress") {
    resources.push(["Сертифицированные средства криптографической защиты", false]);
    actions.push(["Провести аттестацию ИИ-систем на соответствие требованиям ИБ", false]);
  }
  if (scenario === "smart_integrator" || scenario === "integrator_to_hub") {
    resources.push(["Промышленная шина данных (ESB / Data Fabric)", false]);
    actions.push(["Разработать стандарты открытых API для всех модулей", false]);
  }
  if (scenario === "tech_sovereign") {
    resources.push(["Выделенный R&D-полигон для обучения моделей", false]);
    actions.push(["Организовать репозиторий собственных предобученных моделей", false]);
  }
  if (scenario === "national_hub" || scenario === "integrator_to_hub") {
    resources.push(["Маркетплейс ИИ-решений", false]);
    actions.push(["Разработать программу акселерации для внешних команд", false]);
  }
  if (initiative && initiative.trim() !== "") {
    resources.push([
      "Ресурсы для флагманской инициативы: " + initiative.slice(0, 50),
      false,
    ]);
    actions.push([
      "Развернуть пилотный проект «" + initiative.slice(0, 60) + "» с KPI",
      false,
    ]);
  }

  const toItems = (arr: CI[]) =>
      arr
          .slice(0, 16)
          .map(([text, checked]) => ({ id: uid(), text, checked }));
  const resItems = toItems(resources);
  const actItems = toItems(actions);
  while (resItems.length < 12)
    resItems.push({
      id: uid(),
      text: "Дополнительный ресурс: вычислительная инфраструктура и лицензии",
      checked: false,
    });
  while (actItems.length < 12)
    actItems.push({
      id: uid(),
      text: "Дополнительное действие: стратегическая сессия по ИИ-трансформации",
      checked: false,
    });
  return { resources: resItems, actions: actItems };
}

// ---------- Проекты ----------
function generateProjects(
    resources: ChecklistItem[],
    actions: ChecklistItem[],
    direction: string,
    scenario: string
): Project[] {
  // Для образования — курируемая дорожная карта по этапам ТЗ (а не формульная).
  if (direction === "education") {
    return EDU_ROADMAP.map((p) => ({ ...p, id: "edu_rm_" + uid() }));
  }

  let quick: string[] = [];
  resources.forEach((r) =>
      quick.push(r.checked ? `Пилот внедрения: ${r.text}` : `Создание / приобретение: ${r.text}`)
  );
  actions.forEach((a) =>
      quick.push(a.checked ? `Ускоренное выполнение: ${a.text}` : `Реализация действия: ${a.text}`)
  );
  quick = Array.from(new Set(quick)).slice(0, 6);
  if (direction === "education") {
    quick = Array.from(
        new Set([
          "Пилот: нейропомощник абитуриента (приёмная кампания)",
          "Пилот: персональный ИИ-агент сопровождения для тестовой группы",
          "Подсистема этического контроля и политика использования ИИ",
          "Аудит данных, датасетов и существующих ИИ-агентов",
          ...quick,
        ])
    ).slice(0, 7);
  }

  const strategicBase = [
    "Платформа предиктивной аналитики",
    "Мультиагентная оркестрация процессов",
    "Центр компетенций ИИ",
    "Система управления ИИ-активами",
  ];
  const dirStrategic: Record<string, string> = {
    education: "Университетская аналитика компетенций",
    science: "Платформа виртуального скрининга",
    clinic: "Система поддержки врачебных решений",
    production: "Полный цифровой двойник производства",
    services: "Интеллектуальная система управления закупками",
  };
  const scenarioStrategic: Record<string, string> = {
    integrator_to_hub:
        "Единая цифровая платформа СамГМУ → экспортный хаб ИИ-решений",
    digital_fortress: "Национальный центр ИИ-безопасности в здравоохранении",
    smart_integrator: "Единая цифровая платформа СамГМУ (Smart Health Ecosystem)",
    tech_sovereign: "Фабрика медицинских ИИ-моделей с открытым кодом",
    national_hub: "Экспортный хаб российских медицинских ИИ-решений",
  };
  const eduStrategic =
      direction === "education"
          ? [
            "Реестр ИИ-агентов (Agent Hub) и единый Data Lake (FHIR/HL7)",
            "Актуализация 70% программ + масштабирование агентов на 100% студентов",
            "Трекинг ИИ-активности ППС + KPI и материальное стимулирование",
            "100% аккредитация ППС по ИИ-компетенциям (2031)",
            "Коммерциализация: цифровые двойники ППС и датасеты (SaaS / API)",
          ]
          : [];
  const strategic = [
    ...eduStrategic,
    ...strategicBase,
    dirStrategic[direction] || "Стратегическая ИИ-платформа",
    scenarioStrategic[scenario] || "",
  ].filter(Boolean);

  return [
    ...quick.map((name, i) => ({
      id: `quick_${uid()}`,
      name,
      activities: "Реализация в ближайшие кварталы",
      kpi: "Эффективность +15–30%",
      type: "quick" as const,
      startQuarter: Math.min(i, 11),
      duration: 2,
    })),
    ...strategic.map((name, i) => ({
      id: `strat_${uid()}`,
      name,
      activities: "Системная трансформация, масштабирование",
      kpi: "ROI >200% за 3 года",
      type: "strategic" as const,
      startQuarter: Math.min(4 + i, 11),
      duration: 4,
    })),
  ];
}

// ============================================================
//  Начальное состояние
// ============================================================
const INITIATIVE_DEFAULT =
    "Трансформация образовательных процессов на основе ИИ — первый медицинский AI-native университет: 100% ППС обучены и аккредитованы по ИИ-компетенциям, 70% программ содержат ИИ-элементы, адаптивные траектории и цифровой профиль для 100% студентов, ИИ-симуляции и база знаний обучающих материалов.";

// Итоги Модуля 1 группы «Образование» (для справочной карточки на шаге 1)
const MODULE1 = {
  scenario: "Национальный хаб (гибрид: внешние мощности + партнёры → наращивание собственных компетенций)",
  vision: "«Первый медицинский AI-native университет» — адаптивное образование, интеграция клиники и науки",
  smart:
      "Трансформация образовательных процессов на основе ИИ: 100% ППС обучены и аккредитованы по ИИ-компетенциям, 70% программ содержат ИИ-элементы, адаптивные траектории для 100% студентов (цифровой профиль).",
  roadmap: [
    "Год 1 — политика использования ИИ + пилотная e-симуляция",
    "Год 2 — актуализация 30% программ, ИИ-агенты для ППС",
    "Год 5 (2031) — 100% ППС обучены, полное адаптивное обучение, переход к AI OS",
  ],
  roles: [
    "Разработчик ИИ-агентов",
    "Фасилитатор",
    "Создатель мультимодального контента",
  ],
  barriers: [
    "Из ~900 обученных ППС ИИ активно используют <1%",
    "Стоимость LLM-токенов и безопасного контура",
    "Риск «галлюцинаций» в медобразовании",
    "Сопротивление ППС старшего поколения",
  ],
  proposals: [
    "Разработать политику использования ИИ: этика, безопасность, ответственность",
    "Запустить пилот адаптивного обучения и ИИ-симуляции на одной кафедре",
    "Ввести аккредитацию ППС по ИИ-компетенциям, привязать к KPI",
    "Создать базу знаний обучающих материалов как основу для обучения моделей",
  ],
};

const HORIZON_LABEL: Record<string, string> = {
  now: "Сейчас",
  future: "В перспективе",
};
const SOURCING_LABEL: Record<string, string> = {
  self: "Своя разработка",
  integrate: "Интеграция",
};
const TIER_LABEL: Record<string, string> = {
  core: "Основное",
  optional: "Дополнительное",
};

// Внешние программно-аппаратные ресурсы (интегрируем у игроков РФ)
const EXTERNAL_RESOURCES: { label: string; link?: string }[] = [
  { label: "Облачные GPU-мощности (Cloud.ru Evolution / Yandex Cloud)", link: "https://cloud.ru" },
  { label: "Фундаментальная LLM GigaChat (Сбер)", link: "https://giga.chat" },
  { label: "Фундаментальная LLM YandexGPT (Яндекс)", link: "https://education.yandex.ru/ai" },
  { label: "Технологический стек индустриального партнёра (ядро, API-шлюз)" },
  { label: "1С:Автоматизированное составление расписания. Университет", link: "https://solutions.1c.ru/catalog/asp_univer/features" },
  { label: "Платформа «Виртуальный пациент» (НМО, Минздрав)", link: "https://edu.rosminzdrav.ru/specialistam/proekty/2/" },
  { label: "Карьерная среда «Факультетус»", link: "https://facultetus.ru/about" },
  { label: "Единый цифровой профиль студента (Минобрнауки/Минцифры)", link: "https://ria.ru/20250321/falkov-2006413987.html" },
];

// Внутренние программно-аппаратные ресурсы (делаем/держим сами)
const INTERNAL_RESOURCES: string[] = [
  "Локальный защищённый GPU-кластер (152-ФЗ, врачебная тайна)",
  "Собственные дообученные специализированные ИИ-модели",
  "Верифицированные медицинские и образовательные датасеты",
  "Data Lake в стандартах FHIR/HL7",
  "Реестр ИИ-агентов (Agent Hub) и интеллектуальное ядро",
  "MLOps-контур: мониторинг, версионирование, дообучение",
  "Подсистема этического контроля ИИ",
];

// Внешние программно-аппаратные ресурсы (аренда облака — под агентов/инференс, дешевле)
const EXTERNAL_HARDWARE: string[] = [
  "Облачный GPU-инстанс: 1× NVIDIA A100 80GB, 16 vCPU, 128 ГБ RAM — инференс агентов · от ~150 тыс ₽/мес",
  "Облачный сервер: 1–2× NVIDIA H100 80GB, NVMe — RAG и продакшн-агенты · ~250–500 тыс ₽/мес (H100 от ~250 ₽/час)",
  "Почасовой облачный кластер на пиковые задачи (Cloud.ru / Selectel / T1) · оплата по факту, без CAPEX",
];

// Внутренние программно-аппаратные ресурсы (свои серверы — под обучение нейросетей, дороже)
const INTERNAL_HARDWARE: string[] = [
  "AI-сервер обучения NVIDIA DGX H100: 8× H100 SXM 80GB (640 ГБ HBM3), 2× Xeon Platinum 8480C (112 ядер), 2 ТБ DDR5 · ~25–40 млн ₽",
  "Бюджетнее: платформа 8× H100 80GB (Gigabyte), 2× Xeon Scalable, DDR5, NVMe · ~12–18 млн ₽",
  "Узел хранения Data Lake: all-flash NVMe, 100+ ТБ · ~3–6 млн ₽",
  "Сетевая фабрика InfiniBand 400G (NVLink/NVSwitch) для кластера · в составе платформы",
  "Защищённый ЦОД-контур: СКЗИ, физическая изоляция для ПДн (152-ФЗ) · CAPEX",
];

// Курируемая дорожная карта группы «Образование» по этапам ТЗ (6.1–6.3).
// Шкала: 12 полугодий 2026–2031. start — индекс полугодия (0..11), dur — длительность.
const EDU_ROADMAP: Omit<Project, "id">[] = [
  // Этап 1 — пилоты и фундамент (2026–2027)
  { name: "Рабочая группа по ИИ и аудит данных/агентов", activities: "Оргструктура, инвентаризация данных, датасетов и сервисов", kpi: "Аудит завершён, дорожная карта утверждена", type: "quick", startQuarter: 0, duration: 1 },
  { name: "Политика использования ИИ и этический контроль", activities: "Этика, безопасность, ответственность; подсистема этического контроля", kpi: "Политика утверждена", type: "quick", startQuarter: 0, duration: 2 },
  { name: "Защищённый контур + облачные мощности", activities: "Локальный кластер для ПДн + облако индустриального партнёра", kpi: "Контур аттестован (152-ФЗ)", type: "quick", startQuarter: 0, duration: 2 },
  { name: "Пилот: нейропомощник абитуриента", activities: "Чат для абитуриентов и родителей в приёмную кампанию", kpi: "−30% нагрузки приёмной комиссии", type: "quick", startQuarter: 1, duration: 2 },
  { name: "Пилот: персональный агент сопровождения (тестовая группа)", activities: "Цифровой профиль + адаптация сложности материала", kpi: "Отработаны механизмы адаптивного обучения", type: "quick", startQuarter: 2, duration: 2 },
  { name: "База знаний и образовательные датасеты", activities: "Сбор, разметка и верификация учебных материалов", kpi: "Массивы готовы для дообучения моделей", type: "strategic", startQuarter: 1, duration: 5 },
  // Этап 2 — масштабирование и интеграция (2028–2029)
  { name: "Реестр ИИ-агентов (Agent Hub) и Data Lake (FHIR/HL7)", activities: "Каталог агентов, агрегация верифицированных данных", kpi: "Единый ИИ-ландшафт запущен", type: "strategic", startQuarter: 4, duration: 3 },
  { name: "Актуализация программ с ИИ-элементами (30%→70%)", activities: "Обновление РПД и образовательного контента", kpi: "70% программ содержат ИИ-элементы", type: "strategic", startQuarter: 4, duration: 4 },
  { name: "Масштабирование персональных агентов на 100% студентов", activities: "Развёртывание агента сопровождения на весь контингент", kpi: "100% охват обучающихся", type: "strategic", startQuarter: 5, duration: 3 },
  { name: "Цифровые двойники преподавателей", activities: "Помощники на авторских материалах ППС для студентов", kpi: "Двойники доступны студентам", type: "strategic", startQuarter: 5, duration: 3 },
  { name: "Трекинг ИИ-активности ППС + KPI", activities: "Учёт разработки агентов, фасилитации, контента", kpi: "Привязка к материальному стимулированию", type: "quick", startQuarter: 4, duration: 2 },
  { name: "Массовая аккредитация ППС по ИИ-компетенциям", activities: "Обучение и аттестация преподавателей", kpi: "Резкий рост охвата ППС", type: "strategic", startQuarter: 5, duration: 4 },
  // Этап 3 — AI-native и коммерциализация (2030–2031)
  { name: "100% аккредитация ППС по ИИ-компетенциям", activities: "Завершение программы аккредитации", kpi: "100% ППС (2031)", type: "strategic", startQuarter: 8, duration: 3 },
  { name: "Полное адаптивное обучение и мультиагентная оркестрация", activities: "Социальная сеть агентов, переход к AI OS", kpi: "Статус AI-native университета", type: "strategic", startQuarter: 8, duration: 4 },
  { name: "Коммерциализация: двойники ППС и датасеты (SaaS/API)", activities: "Лицензирование, API-доступ, вывод на рынок", kpi: "Выручка на рынке EdTech/MedTech", type: "strategic", startQuarter: 9, duration: 3 },
];

// Элементы образа будущего по ТЗ, раздел 5.1 «Образование» (с привязкой к пунктам).
// horizon: now=реализовать сейчас, future=в перспективе.
// sourcing: integrate=есть у крупных игроков РФ (Сбер/Яндекс/Минобрнауки) → интеграция; self=своя разработка.
const EDUCATION_SEED: Module[] = [
  { id: "edu_fgos", name: "Актуализация РПД по ФГОС", desc: "Автоматизированное обновление рабочих программ в соответствии с ФГОС.", tz: "5.1.1", horizon: "now", sourcing: "self", tier: "optional", level: "Ядро" },
  { id: "edu_autocheck", name: "Первичная проверка учебных работ", desc: "ИИ-проверка типовых работ и генерация тестов, без замены преподавателя.", tz: "5.1.1", horizon: "now", sourcing: "integrate", tier: "optional", link: "https://education.yandex.ru/ai", level: "Аналитика и прогнозирование" },
  { id: "edu_tutor", name: "Базовые консультации студентов", desc: "Ответы по программе 24/7 на базе LLM, без замены преподавателя.", tz: "5.1.1", horizon: "now", sourcing: "integrate", tier: "optional", link: "https://giga.chat/help/articles/ai-for-study", level: "Мультиагентный слой" },
  { id: "edu_agent", name: "Персональный агент сопровождения студента", desc: "Адаптирует материал, ведёт по программе и успеваемости (сборка на своих данных).", tz: "5.1.2", horizon: "now", sourcing: "self", tier: "core", level: "Мультиагентный слой" },
  { id: "edu_profile", name: "Цифровой профиль студента", desc: "Профиль знаний, компетенций и активности обучающегося.", tz: "5.1.2", horizon: "now", sourcing: "integrate", tier: "core", link: "https://ria.ru/20250321/falkov-2006413987.html", level: "Интеграция и интерфейсы" },
  { id: "edu_competence", name: "ИИ-оценка компетентностного профиля", desc: "Оценка компетенций и рекомендации по треку (на своих данных).", tz: "5.1.2", horizon: "future", sourcing: "self", tier: "core", level: "Аналитика и прогнозирование" },
  { id: "edu_dropout", name: "Прогноз риска отчисления", desc: "Предиктивная аналитика рисков на данных вуза.", tz: "5.1.2", horizon: "future", sourcing: "self", tier: "optional", level: "Аналитика и прогнозирование" },
  { id: "edu_sim", name: "Симуляции клинических случаев", desc: "Интерактивные клинические сценарии под уровень обучающегося (есть базовая платформа РФ).", tz: "5.1.3", horizon: "now", sourcing: "integrate", tier: "core", link: "https://edu.rosminzdrav.ru/specialistam/proekty/2/", level: "Продукт" },
  { id: "edu_twin", name: "Цифровой двойник преподавателя", desc: "Помощник на авторских материалах ППС, доступный студентам.", tz: "5.1.4", horizon: "future", sourcing: "self", tier: "core", level: "Продукт" },
  { id: "edu_admission", name: "Агент приёмной кампании", desc: "Чат для абитуриентов и родителей в непрерывном режиме.", tz: "5.1.5", horizon: "now", sourcing: "integrate", tier: "optional", link: "https://giga.chat", level: "Мультиагентный слой" },
  { id: "edu_schedule", name: "Агент оптимизации расписания", desc: "Оптимизация расписания: аудитории, ППС, логистика (есть готовый продукт).", tz: "5.1.6", horizon: "future", sourcing: "integrate", tier: "optional", link: "https://solutions.1c.ru/catalog/asp_univer/features", level: "Интеграция и интерфейсы" },
  { id: "edu_roles", name: "Поддержка новых ролей ППС", desc: "Разработчик ИИ-агентов, фасилитатор, создатель мультимодального контента.", tz: "5.1.7", horizon: "now", sourcing: "self", tier: "core", level: "Пользователи и новые роли" },
  { id: "edu_kpi", name: "Трекинг ИИ-активности ППС", desc: "Учёт активности с привязкой к KPI и стимулированию (внутренняя система).", tz: "5.1.8", horizon: "future", sourcing: "self", tier: "optional", level: "Бизнес-модель" },
  { id: "edu_career", name: "ИИ-сопровождение карьеры «от школы до выпуска»", desc: "Карьерные траектории и прогноз трудоустройства выпускников.", tz: "5.1.9", horizon: "future", sourcing: "integrate", tier: "optional", link: "https://facultetus.ru/about", level: "Аналитика и прогнозирование" },
  { id: "edu_kb", name: "База знаний и образовательные датасеты", desc: "Верифицированные массивы для дообучения моделей.", tz: "5.1.10", horizon: "now", sourcing: "self", tier: "core", level: "Ядро" },
  { id: "edu_social", name: "Формирование социальной сети агентов", desc: "Среда взаимодействия и оркестрации ИИ-агентов между собой и с пользователями.", horizon: "future", sourcing: "self", tier: "core", level: "Мультиагентный слой" },
  { id: "edu_unikb", name: "Единая база знаний для образования, науки и инноваций", desc: "Сквозной Data Lake / хаб знаний по всем направлениям университета.", horizon: "future", sourcing: "self", tier: "core", level: "Ядро" },
];

function freshState(): AppState {
  const direction = "education";
  const scenario = "integrator_to_hub";
  const initiative = INITIATIVE_DEFAULT;
  const modules = generateModules(direction, scenario, initiative);
  const selectedIds = modules.map((m) => m.id);
  return {
    step: 1,
    direction,
    scenario,
    initiative,
    modules,
    selectedIds,
    levels: buildLevels(modules),
    resources: [],
    actions: [],
    projects: [],
    theme: "light",
  };
}

// ============================================================
//  Компонент
// ============================================================
export default function Home() {
  const [state, setState] = useState<AppState>(freshState);
  const [hydrated, setHydrated] = useState(false);

  // Облачная синхронизация (общий код группы)
  const [cloudCode, setCloudCode] = useState("");
  const [cloudStatus, setCloudStatus] = useState("");
  const [cloudLinked, setCloudLinked] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Загрузка из localStorage
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as AppState;
        const merged = { ...freshState(), ...parsed };
        // Подмешиваем актуальные флаги/ссылки из EDUCATION_SEED (не затирая ручные правки)
        const seedById = new Map(EDUCATION_SEED.map((s) => [s.id, s]));
        merged.modules = merged.modules.map((m) => {
          const seed = seedById.get(m.id);
          return seed ? { ...seed, ...m } : m;
        });
        setState(merged);
      }
      const code = localStorage.getItem("samgmu_cloud_code");
      if (code) setCloudCode(code);
    } catch {
      /* ignore */
    }
    setHydrated(true);
  }, []);

  // Автосборка схемы, если её ещё нет (выбираем всё и распределяем по слоям)
  const didAutoBuild = useRef(false);
  useEffect(() => {
    if (!hydrated || didAutoBuild.current) return;
    didAutoBuild.current = true;
    setState((s) => {
      if (s.levels.length > 0 || s.modules.length === 0) return s;
      const ids = s.modules.map((m) => m.id);
      return { ...s, selectedIds: ids, levels: buildLevels(s.modules) };
    });
  }, [hydrated]);

  // Сохранение в localStorage
  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      /* ignore */
    }
  }, [state, hydrated]);

  // Запоминаем код группы
  useEffect(() => {
    if (hydrated) localStorage.setItem("samgmu_cloud_code", cloudCode);
  }, [cloudCode, hydrated]);

  // Скролл наверх при переключении раздела
  useEffect(() => {
    if (typeof window !== "undefined")
      window.scrollTo({ top: 0, behavior: "smooth" });
  }, [state.step]);

  const patch = useCallback(
      (p: Partial<AppState>) => setState((s) => ({ ...s, ...p })),
      []
  );

  const moduleById = useCallback(
      (id: string) => state.modules.find((m) => m.id === id),
      [state.modules]
  );
  const selectedModules = state.modules.filter((m) =>
      state.selectedIds.includes(m.id)
  );

  // ---------- Переходы между шагами ----------
  const goStep = (step: number) => patch({ step });

  const startFromContext = () => {
    const modules = generateModules(
        state.direction,
        state.scenario,
        state.initiative
    );
    // по умолчанию выбираем все элементы и сразу собираем схему
    patch({
      modules,
      selectedIds: modules.map((m) => m.id),
      levels: buildLevels(modules),
      step: 2,
    });
  };

  const buildSchema = () => {
    if (state.selectedIds.length === 0) {
      alert("Сначала выберите хотя бы один элемент.");
      return;
    }
    patch({ levels: buildLevels(selectedModules, state.levels) });
  };

  const goReadiness = () => {
    if (state.selectedIds.length === 0) {
      alert("Выберите элементы образа будущего.");
      return;
    }
    const next: Partial<AppState> = { step: 3 };
    if (state.resources.length === 0 && state.actions.length === 0) {
      const { resources, actions } = generateChecklists(
          selectedModules,
          state.direction,
          state.scenario,
          state.initiative
      );
      next.resources = resources;
      next.actions = actions;
    }
    patch(next);
  };

  const makeProjects = () => {
    patch({
      projects: generateProjects(
          state.resources,
          state.actions,
          state.direction,
          state.scenario
      ),
    });
  };

  // ---------- Действия с модулями ----------
  const toggleModule = (id: string) =>
      setState((s) => ({
        ...s,
        selectedIds: s.selectedIds.includes(id)
            ? s.selectedIds.filter((x) => x !== id)
            : [...s.selectedIds, id],
      }));

  const setModuleFlag = (
      id: string,
      field: "horizon" | "sourcing" | "tier",
      value: string
  ) =>
      setState((s) => ({
        ...s,
        modules: s.modules.map((m) =>
            m.id === id ? { ...m, [field]: value || undefined } : m
        ),
      }));
  const updateModule = (id: string, patch: Partial<Module>) =>
      setState((s) => ({
        ...s,
        modules: s.modules.map((m) => (m.id === id ? { ...m, ...patch } : m)),
      }));
  const deleteModule = (id: string) =>
      setState((s) => ({
        ...s,
        modules: s.modules.filter((m) => m.id !== id),
        selectedIds: s.selectedIds.filter((x) => x !== id),
        levels: s.levels.map((l) => ({
          ...l,
          moduleIds: l.moduleIds.filter((x) => x !== id),
        })),
      }));

  const [customName, setCustomName] = useState("");
  const [customDesc, setCustomDesc] = useState("");
  const [customHorizon, setCustomHorizon] = useState<"now" | "future">("now");
  const [customSourcing, setCustomSourcing] = useState<"self" | "integrate">(
      "self"
  );
  const [customTier, setCustomTier] = useState<"core" | "optional">("optional");
  const [customLink, setCustomLink] = useState("");
  // Фильтры элементов по флагам
  const [fHorizon, setFHorizon] = useState("all");
  const [fSourcing, setFSourcing] = useState("all");
  const [fTier, setFTier] = useState("all");
  const [showModel, setShowModel] = useState(false);
  const addCustomModule = () => {
    const name = customName.trim();
    if (!name) return;
    const m: Module = {
      id: "cust_" + uid(),
      name,
      desc: customDesc.trim() || "Пользовательский элемент",
      horizon: customHorizon,
      sourcing: customSourcing,
      tier: customTier,
      link:
          customSourcing === "integrate" && customLink.trim()
              ? customLink.trim()
              : undefined,
    };
    setState((s) => ({
      ...s,
      modules: [...s.modules, m],
      selectedIds: [...s.selectedIds, m.id],
    }));
    setCustomName("");
    setCustomDesc("");
    setCustomHorizon("now");
    setCustomSourcing("self");
    setCustomTier("optional");
    setCustomLink("");
  };

  // ---------- Схема: уровни ----------
  const renameLevel = (lid: string, title: string) =>
      setState((s) => ({
        ...s,
        levels: s.levels.map((l) => (l.id === lid ? { ...l, title } : l)),
      }));
  const deleteLevel = (lid: string) =>
      setState((s) => ({ ...s, levels: s.levels.filter((l) => l.id !== lid) }));
  const addLevel = () =>
      setState((s) => ({
        ...s,
        levels: [...s.levels, { id: uid(), title: "Новый слой", moduleIds: [] }],
      }));
  const removeModuleFromSchema = (mid: string) =>
      setState((s) => ({
        ...s,
        levels: s.levels.map((l) => ({
          ...l,
          moduleIds: l.moduleIds.filter((x) => x !== mid),
        })),
        selectedIds: s.selectedIds.filter((x) => x !== mid),
      }));

  const dragRef = useRef<{ mid: string; from: string } | null>(null);
  const onModuleDragStart = (mid: string, from: string) => {
    dragRef.current = { mid, from };
  };
  const onLevelDrop = (toLid: string) => {
    const d = dragRef.current;
    dragRef.current = null;
    if (!d || d.from === toLid) return;
    setState((s) => ({
      ...s,
      levels: s.levels.map((l) => {
        if (l.id === d.from)
          return { ...l, moduleIds: l.moduleIds.filter((x) => x !== d.mid) };
        if (l.id === toLid)
          return { ...l, moduleIds: [...l.moduleIds, d.mid] };
        return l;
      }),
    }));
  };

  // ---------- Чек-листы ----------
  const toggleCheck = (kind: "resources" | "actions", id: string) =>
      setState((s) => ({
        ...s,
        [kind]: s[kind].map((it) =>
            it.id === id ? { ...it, checked: !it.checked } : it
        ),
      }));
  const editCheck = (kind: "resources" | "actions", id: string, text: string) =>
      setState((s) => ({
        ...s,
        [kind]: s[kind].map((it) => (it.id === id ? { ...it, text } : it)),
      }));
  const deleteCheck = (kind: "resources" | "actions", id: string) =>
      setState((s) => ({ ...s, [kind]: s[kind].filter((it) => it.id !== id) }));
  const addCheck = (kind: "resources" | "actions") =>
      setState((s) => ({
        ...s,
        [kind]: [...s[kind], { id: uid(), text: "Новый пункт", checked: false }],
      }));

  // ---------- Проекты ----------
  const editProject = (id: string, field: keyof Project, value: string) =>
      setState((s) => ({
        ...s,
        projects: s.projects.map((p) =>
            p.id === id ? { ...p, [field]: value } : p
        ),
      }));
  const deleteProject = (id: string) =>
      setState((s) => ({ ...s, projects: s.projects.filter((p) => p.id !== id) }));
  const addProject = () =>
      setState((s) => ({
        ...s,
        projects: [
          ...s.projects,
          {
            id: "manual_" + uid(),
            name: "Новый проект",
            activities: "Описание работ",
            kpi: "KPI",
            type: "quick",
            startQuarter: 0,
            duration: 2,
          },
        ],
      }));

  // ---------- Гант: перетаскивание и изменение длительности ----------
  const ganttDrag = (
      e: ReactMouseEvent,
      id: string,
      mode: "move" | "resize"
  ) => {
    e.preventDefault();
    e.stopPropagation();
    const proj = state.projects.find((p) => p.id === id);
    if (!proj) return;
    const startX = e.clientX;
    const origStart = proj.startQuarter;
    const origDur = proj.duration;
    const onMove = (me: MouseEvent) => {
      const delta = Math.round((me.clientX - startX) / QUARTER_WIDTH);
      setState((s) => ({
        ...s,
        projects: s.projects.map((p) => {
          if (p.id !== id) return p;
          if (mode === "move") {
            const ns = Math.max(0, Math.min(11, origStart + delta));
            return { ...p, startQuarter: ns };
          }
          const maxDur = 12 - p.startQuarter;
          const nd = Math.max(1, Math.min(maxDur, origDur + delta));
          return { ...p, duration: nd };
        }),
      }));
    };
    const onUp = () => document.removeEventListener("mousemove", onMove);
    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseup", onUp, { once: true });
  };

  const resetAll = () => {
    if (confirm("Сбросить весь прогресс и начать заново?")) {
      localStorage.removeItem(STORAGE_KEY);
      setState(freshState());
    }
  };

  const toggleTheme = () =>
      patch({ theme: state.theme === "light" ? "dark" : "light" });

  // ---------- Облако (общая копия по коду группы) ----------
  async function loadCloud() {
    const code = cloudCode.trim();
    if (!code) {
      setCloudStatus("Введите код группы");
      return;
    }
    setCloudStatus("Загрузка…");
    try {
      const r = await fetch(`/api/state?code=${encodeURIComponent(code)}`, {
        cache: "no-store",
      });
      if (r.status === 501) {
        setCloudStatus("Облако не подключено: добавьте хранилище на Vercel (см. README)");
        return;
      }
      const data = await r.json();
      if (!data || !data.state) {
        setCloudStatus("В облаке пока нет данных по этому коду");
        setCloudLinked(true);
        return;
      }
      setState({ ...freshState(), ...data.state });
      setCloudLinked(true);
      setCloudStatus("Загружено из облака ✓");
    } catch {
      setCloudStatus("Ошибка загрузки");
    }
  }

  async function saveCloud(silent = false) {
    const code = cloudCode.trim();
    if (!code) {
      if (!silent) setCloudStatus("Введите код группы");
      return;
    }
    if (!silent) setCloudStatus("Сохранение…");
    try {
      const r = await fetch("/api/state", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, state }),
      });
      if (r.status === 501) {
        setCloudStatus("Облако не подключено: добавьте хранилище на Vercel (см. README)");
        return;
      }
      if (!r.ok) {
        setCloudStatus("Ошибка сохранения");
        return;
      }
      setCloudLinked(true);
      setCloudStatus("Сохранено в облако ✓ " + new Date().toLocaleTimeString());
    } catch {
      setCloudStatus("Ошибка сохранения");
    }
  }

  // Автосохранение в облако после привязки кода (с задержкой)
  useEffect(() => {
    if (!hydrated || !cloudLinked || !cloudCode.trim()) return;
    const t = setTimeout(() => {
      void saveCloud(true);
    }, 1500);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state, cloudLinked, cloudCode, hydrated]);

  // ---------- Экспорт / импорт файла (без бэкенда) ----------
  function exportJSON() {
    const blob = new Blob([JSON.stringify(state, null, 2)], {
      type: "application/json",
    });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `samgmu-module2-${state.direction}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
    setCloudStatus("Файл выгружен ✓");
  }

  function importJSON(file: File) {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result)) as Partial<AppState>;
        setState({ ...freshState(), ...parsed });
        setCloudStatus("Импортировано из файла ✓");
      } catch {
        setCloudStatus("Не удалось прочитать файл");
      }
    };
    reader.readAsText(file);
  }

  const techStack = deriveTechStack(selectedModules);

  // ----- До гидрации: пустой фон, чтобы не было рассинхрона -----
  if (!hydrated) {
    return (
        <div
            className={`min-h-screen ${
                state.theme === "dark" ? "bg-slate-950" : "bg-slate-50"
            }`}
        />
    );
  }

  const dark = state.theme === "dark";

  // Палитра под фирменный стиль СамГМУ: синий (#0A4DA2) + белый + графит
  const c = {
    page: dark ? "bg-slate-950 text-slate-100" : "bg-slate-50 text-slate-800",
    card: dark
        ? "bg-slate-900 border border-slate-800"
        : "bg-white border border-slate-200 shadow-sm",
    heading: dark ? "text-blue-300" : "text-[#0A4DA2]",
    muted: dark ? "text-slate-400" : "text-slate-500",
    input: dark
        ? "bg-slate-800 border border-slate-700 text-slate-100 placeholder-slate-500"
        : "bg-white border border-slate-300 text-slate-800 placeholder-slate-400",
    secondary: dark
        ? "bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700"
        : "bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200",
    chip: dark ? "bg-blue-500/15 text-blue-300" : "bg-[#0A4DA2]/10 text-[#0A4DA2]",
    subtle: dark
        ? "bg-slate-800/50 border border-slate-700"
        : "bg-slate-50 border border-slate-200",
    tile: dark
        ? "bg-slate-800/50 border border-slate-700"
        : "bg-white border border-slate-200",
    border: dark ? "border-slate-800" : "border-slate-200",
    grid: dark ? "border-slate-800/60" : "border-slate-100",
  };
  const btn =
      "inline-flex items-center justify-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold transition-colors disabled:opacity-50";
  const primary = "bg-[#0A4DA2] hover:bg-[#073A7A] text-white";
  const flagCls = (kind: "horizon" | "sourcing" | "tier", v?: string) => {
    if (!v) return dark ? "bg-slate-700 text-slate-300" : "bg-slate-200 text-slate-600";
    if (kind === "horizon")
      return v === "now"
          ? dark
              ? "bg-emerald-500/15 text-emerald-300"
              : "bg-emerald-100 text-emerald-700"
          : dark
              ? "bg-amber-500/15 text-amber-300"
              : "bg-amber-100 text-amber-700";
    if (kind === "tier")
      return v === "core"
          ? dark
              ? "bg-rose-500/15 text-rose-300"
              : "bg-rose-100 text-rose-700"
          : dark
              ? "bg-slate-600/40 text-slate-300"
              : "bg-slate-200 text-slate-600";
    return v === "self"
        ? dark
            ? "bg-blue-500/15 text-blue-300"
            : "bg-blue-100 text-blue-700"
        : dark
            ? "bg-violet-500/15 text-violet-300"
            : "bg-violet-100 text-violet-700";
  };

  const steps = [
    "Контекст",
    "Конкретизация и схема",
    "Готовность и проекты",
    "Дорожная карта",
    "Итоговый отчёт",
  ];

  // Полоса Ганта + строки (используется на шаге 4 и в отчёте)
  const renderGantt = (editable: boolean) => (
      <div className={`overflow-x-auto rounded-2xl border ${c.border}`}>
        <div className="grid grid-cols-[240px_repeat(12,80px)]">
          {/* Заголовок */}
          <div className={`flex items-center px-3 py-2 text-[11px] font-semibold ${c.muted}`}>
            Проект
          </div>
          {QUARTERS.map((q) => (
              <div
                  key={q}
                  className={`border-l ${c.grid} py-2 text-center text-[11px] font-semibold ${c.muted}`}
              >
                {q}
              </div>
          ))}

          {state.projects.length === 0 && (
              <div className={`col-span-full p-4 text-sm ${c.muted}`}>
                Нет проектов — вернитесь на шаг 3 и нажмите «Предложить проекты».
              </div>
          )}

          {state.projects.map((p) => {
            const start = Math.min(p.startQuarter, 11);
            const dur = Math.min(p.duration, 12 - start);
            const end = Math.min(start + dur - 1, 11);
            const range =
                dur > 1 ? `${QUARTERS[start]} – ${QUARTERS[end]}` : QUARTERS[start];
            return (
                <div key={p.id} className="contents">
                  <div
                      className={`relative col-span-full grid grid-cols-[240px_repeat(12,80px)] items-stretch border-t ${c.border}`}
                      style={{ minHeight: 56 }}
                  >
                    <div
                        className={`flex items-center px-3 py-2 text-sm font-medium leading-snug break-words ${
                            dark ? "text-slate-100" : "text-slate-800"
                        }`}
                    >
                      {p.name}
                    </div>
                    {QUARTERS.map((q, qi) => (
                        <div key={qi} className={`border-l ${c.grid}`} />
                    ))}
                    <div
                        onMouseDown={
                          editable ? (e) => ganttDrag(e, p.id, "move") : undefined
                        }
                        className={`absolute top-1/2 flex h-8 -translate-y-1/2 items-center overflow-hidden rounded-full px-2 ${
                            editable ? "cursor-grab" : "cursor-default"
                        } ${p.type === "quick" ? "bg-[#0A4DA2]" : "bg-violet-600"}`}
                        style={{ left: 240 + start * 80, width: dur * 80 - 6 }}
                    >
                  <span className="truncate text-[11px] font-medium text-white">
                    {range}
                  </span>
                      {editable && (
                          <span
                              onMouseDown={(e) => ganttDrag(e, p.id, "resize")}
                              className="absolute bottom-0 right-0 top-0 w-3.5 cursor-ew-resize rounded-r-full bg-white/25"
                          />
                      )}
                    </div>
                  </div>
                </div>
            );
          })}
        </div>
      </div>
  );

  return (
      <div className={`min-h-screen font-sans ${c.page} print:bg-white print:text-black`}>
        <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
          {/* Шапка */}
          <header className="mb-6 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
            <span className="grid h-11 w-11 place-items-center rounded-xl bg-[#0A4DA2] text-lg font-extrabold text-white">
              С
            </span>
              <div className="leading-tight">
                <div className="font-extrabold">ИИ-трансформация СамГМУ</div>
                <div className={`text-xs ${c.muted}`}>
                  Модуль 2 · Группа «Образование»
                </div>
              </div>
            </div>
            <div className="flex gap-2 print:hidden">
              <button className={`${btn} ${c.secondary}`} onClick={() => setShowModel(true)}>
                📊 Модель ассистента
              </button>
              <button className={`${btn} ${c.secondary}`} onClick={toggleTheme}>
                {dark ? "☀️ Светлая" : "🌙 Тёмная"}
              </button>
              <button className={`${btn} ${c.secondary}`} onClick={resetAll}>
                ↺ Сброс
              </button>
            </div>
          </header>

          {/* Прогресс */}
          <nav className="mb-8 grid grid-cols-5 gap-2 print:hidden">
            {steps.map((label, i) => {
              const n = i + 1;
              const active = state.step >= n;
              return (
                  <button
                      key={n}
                      onClick={() => goStep(n)}
                      className="flex flex-col items-center gap-1.5"
                  >
                <span
                    className={`grid h-9 w-9 place-items-center rounded-full text-sm font-bold transition ${
                        active
                            ? "bg-[#0A4DA2] text-white shadow-[0_0_0_4px_rgba(10,77,162,0.2)]"
                            : dark
                                ? "bg-slate-800 text-slate-400"
                                : "bg-slate-200 text-slate-500"
                    }`}
                >
                  {n}
                </span>
                    <span
                        className={`text-center text-[11px] leading-tight ${
                            active ? c.heading : c.muted
                        }`}
                    >
                  {label}
                </span>
                  </button>
              );
            })}
          </nav>

          {/* Облачная синхронизация */}
          <div className={`mb-6 rounded-2xl p-4 ${c.card} print:hidden`}>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm font-semibold">☁️ Синхронизация</span>
              <input
                  value={cloudCode}
                  onChange={(e) => setCloudCode(e.target.value)}
                  placeholder="Код группы (например, education)"
                  className={`min-w-[150px] flex-1 rounded-xl px-3 py-2 text-sm ${c.input}`}
              />
              <button className={`${btn} ${c.secondary}`} onClick={loadCloud}>
                ↓ Загрузить
              </button>
              <button className={`${btn} ${primary}`} onClick={() => saveCloud(false)}>
                ↑ Сохранить в облако
              </button>
              <span className={`mx-1 hidden h-5 w-px sm:inline-block ${dark ? "bg-slate-700" : "bg-slate-300"}`} />
              <button className={`${btn} ${c.secondary}`} onClick={exportJSON}>
                ⬇ Файл .json
              </button>
              <button
                  className={`${btn} ${c.secondary}`}
                  onClick={() => fileInputRef.current?.click()}
              >
                ⬆ Из файла
              </button>
              <input
                  ref={fileInputRef}
                  type="file"
                  accept="application/json,.json"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) importJSON(f);
                    e.target.value = "";
                  }}
              />
            </div>
            <div className={`mt-2 text-xs ${c.muted}`}>
              {cloudStatus ||
                  "Один код = одна общая копия для всей группы на разных ПК. Локальная копия в этом браузере сохраняется всегда. После «Загрузить»/«Сохранить» изменения уходят в облако автоматически."}
            </div>
          </div>

          {/* ШАГ 1 — Контекст */}
          {state.step === 1 && (
              <section className={`mb-6 rounded-3xl p-6 sm:p-7 ${c.card}`}>
                <h2 className={`mb-4 text-xl font-extrabold ${c.heading}`}>
                  Стратегические установки
                </h2>
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="flex flex-col gap-1.5 text-sm">
                    <span className={c.muted}>Направление</span>
                    <select
                        className={`rounded-xl px-3 py-2.5 text-sm ${c.input}`}
                        value={state.direction}
                        onChange={(e) => patch({ direction: e.target.value })}
                    >
                      <option value="education">🎓 Образование (ИИ-Университет)</option>
                      <option value="science">🧬 Наука (ИИ-Наука)</option>
                      <option value="clinic">🏥 Клиника (ИИ-Клиника)</option>
                      <option value="production">🏭 Инновации и производство</option>
                      <option value="services">📊 Сервисы и управление</option>
                    </select>
                  </label>
                  <label className="flex flex-col gap-1.5 text-sm">
                    <span className={c.muted}>Сценарий трансформации</span>
                    <select
                        className={`rounded-xl px-3 py-2.5 text-sm ${c.input}`}
                        value={state.scenario}
                        onChange={(e) => patch({ scenario: e.target.value })}
                    >
                      <option value="integrator_to_hub">
                        🔗→🌍 Умный интегратор → Национальный хаб
                      </option>
                      <option value="digital_fortress">🛡️ Цифровая крепость</option>
                      <option value="smart_integrator">🔗 Умный интегратор</option>
                      <option value="tech_sovereign">⚙️ Технологический суверен</option>
                      <option value="national_hub">🌍 Национальный хаб</option>
                    </select>
                  </label>
                  <label className="flex flex-col gap-1.5 text-sm sm:col-span-2">
                    <span className={c.muted}>Ключевая инициатива</span>
                    <textarea
                        rows={3}
                        className={`rounded-xl px-3 py-2.5 text-sm ${c.input}`}
                        value={state.initiative}
                        onChange={(e) => patch({ initiative: e.target.value })}
                        placeholder="Опишите ключевую инициативу группы…"
                    />
                  </label>
                </div>

                {state.direction === "education" && (
                    <details
                        open
                        className={`mt-5 rounded-2xl border-l-4 border-l-[#0A4DA2] p-4 ${
                            dark
                                ? "border border-slate-800 bg-slate-800/40"
                                : "border border-slate-200 bg-[#0A4DA2]/5"
                        }`}
                    >
                      <summary
                          className={`cursor-pointer list-none font-bold [&::-webkit-details-marker]:hidden ${c.heading}`}
                      >
                        🎓 Итоги Модуля 1 — группа «Образование» (контекст работы)
                      </summary>
                      <div className="mt-3 space-y-2 text-sm leading-relaxed">
                        <p>
                          <strong>Сценарий:</strong> {MODULE1.scenario}
                        </p>
                        <p>
                          <strong>Образ будущего:</strong> {MODULE1.vision}
                        </p>
                        <p>
                          <strong>SMART-цель:</strong> {MODULE1.smart}
                        </p>
                        <div className="mt-2 grid gap-4 sm:grid-cols-2">
                          <div>
                            <strong>Дорожная карта</strong>
                            <ul className="mt-1 list-disc space-y-1 pl-5">
                              {MODULE1.roadmap.map((x) => (
                                  <li key={x}>{x}</li>
                              ))}
                            </ul>
                          </div>
                          <div>
                            <strong>Предложения группы (приоритеты)</strong>
                            <ul className="mt-1 list-disc space-y-1 pl-5">
                              {MODULE1.proposals.map((x) => (
                                  <li key={x}>{x}</li>
                              ))}
                            </ul>
                          </div>
                          <div>
                            <strong>Новые роли ППС</strong>
                            <ul className="mt-1 list-disc space-y-1 pl-5">
                              {MODULE1.roles.map((x) => (
                                  <li key={x}>{x}</li>
                              ))}
                            </ul>
                          </div>
                          <div>
                            <strong>Ключевые барьеры</strong>
                            <ul className="mt-1 list-disc space-y-1 pl-5">
                              {MODULE1.barriers.map((x) => (
                                  <li key={x}>{x}</li>
                              ))}
                            </ul>
                          </div>
                        </div>
                        <p className={`mt-2 text-xs ${c.muted}`}>
                          Источник: презентация «Результаты групп · Модуль 1».
                        </p>
                      </div>
                    </details>
                )}

                <div className="mt-5 flex justify-end">
                  <button className={`${btn} ${primary}`} onClick={startFromContext}>
                    Далее →
                  </button>
                </div>
              </section>
          )}

          {/* ШАГ 2 — Конкретизация и схема */}
          {state.step === 2 && (
              <section className={`mb-6 rounded-3xl p-6 sm:p-7 ${c.card}`}>
                <h2 className={`mb-2 text-xl font-extrabold ${c.heading}`}>
                  Конкретизация инициативы → элементы образа будущего
                </h2>
                <p className={`mb-3 text-sm ${c.muted}`}>
                  Выбрано: {state.selectedIds.length} из {state.modules.length}.
                  Отметьте элементы, которые раскрывают вашу инициативу.
                </p>
                <div className="mb-4 flex flex-wrap items-center gap-2">
                  <span className={`text-xs font-semibold ${c.muted}`}>Фильтр:</span>
                  <select
                      value={fHorizon}
                      onChange={(e) => setFHorizon(e.target.value)}
                      className={`rounded-full px-2.5 py-1 text-xs ${c.input}`}
                  >
                    <option value="all">Срок: все</option>
                    <option value="now">Сейчас</option>
                    <option value="future">В перспективе</option>
                  </select>
                  <select
                      value={fSourcing}
                      onChange={(e) => setFSourcing(e.target.value)}
                      className={`rounded-full px-2.5 py-1 text-xs ${c.input}`}
                  >
                    <option value="all">Реализация: все</option>
                    <option value="self">Своя разработка</option>
                    <option value="integrate">Интеграция</option>
                  </select>
                  <select
                      value={fTier}
                      onChange={(e) => setFTier(e.target.value)}
                      className={`rounded-full px-2.5 py-1 text-xs ${c.input}`}
                  >
                    <option value="all">Значимость: все</option>
                    <option value="core">Основное</option>
                    <option value="optional">Дополнительное</option>
                  </select>
                  {(fHorizon !== "all" ||
                      fSourcing !== "all" ||
                      fTier !== "all") && (
                      <button
                          onClick={() => {
                            setFHorizon("all");
                            setFSourcing("all");
                            setFTier("all");
                          }}
                          className={`rounded-full px-2.5 py-1 text-xs ${c.secondary}`}
                      >
                        Сбросить
                      </button>
                  )}
                </div>
                <div className="grid gap-4 lg:grid-cols-[1fr_280px]">
                  <div className="grid max-h-[520px] gap-2.5 overflow-y-auto pr-1 sm:grid-cols-2">
                    {state.modules
                        .filter(
                            (m) =>
                                (fHorizon === "all" || m.horizon === fHorizon) &&
                                (fSourcing === "all" || m.sourcing === fSourcing) &&
                                (fTier === "all" || m.tier === fTier)
                        )
                        .map((m) => {
                          const on = state.selectedIds.includes(m.id);
                          return (
                              <div
                                  key={m.id}
                                  className={`rounded-2xl p-3 transition ${
                                      on
                                          ? `ring-2 ring-[#0A4DA2] ${
                                              dark ? "bg-slate-800" : "bg-[#0A4DA2]/5"
                                          }`
                                          : c.tile
                                  }`}
                              >
                                <div className="flex items-start gap-2">
                                  <input
                                      type="checkbox"
                                      className="mt-1.5 h-4 w-4 shrink-0 accent-[#0A4DA2]"
                                      checked={on}
                                      onChange={() => toggleModule(m.id)}
                                      title={on ? "Выбрано" : "Выбрать элемент"}
                                  />
                                  <div className="min-w-0 flex-1">
                                    <div className="flex items-center gap-2">
                                      <input
                                          value={m.name}
                                          onChange={(e) =>
                                              updateModule(m.id, { name: e.target.value })
                                          }
                                          className={`min-w-0 flex-1 bg-transparent text-sm font-semibold outline-none ${
                                              dark ? "text-slate-100" : "text-slate-800"
                                          }`}
                                      />
                                      {m.tz && (
                                          <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold ${c.chip}`}>
                                ТЗ {m.tz}
                              </span>
                                      )}
                                      <button
                                          onClick={() => deleteModule(m.id)}
                                          title="Удалить элемент"
                                          className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-red-500/20 text-xs text-red-500 hover:bg-red-500/30"
                                      >
                                        ×
                                      </button>
                                    </div>
                                    <textarea
                                        value={m.desc}
                                        onChange={(e) =>
                                            updateModule(m.id, { desc: e.target.value })
                                        }
                                        rows={2}
                                        className={`mt-1 w-full resize-none rounded-md bg-transparent text-xs outline-none ${c.muted}`}
                                    />
                                    {m.sourcing === "integrate" && (
                                        <div className="mt-1 flex items-center gap-1.5">
                                          <span className="shrink-0 text-[11px]">🔗</span>
                                          <input
                                              value={m.link ?? ""}
                                              onChange={(e) =>
                                                  updateModule(m.id, { link: e.target.value })
                                              }
                                              placeholder="ссылка на источник интеграции"
                                              className={`min-w-0 flex-1 rounded-md px-2 py-1 text-[11px] ${c.input}`}
                                          />
                                          {m.link && (
                                              <a
                                                  href={m.link}
                                                  target="_blank"
                                                  rel="noopener noreferrer"
                                                  className={`shrink-0 rounded-md px-2 py-1 text-[11px] font-semibold ${c.chip}`}
                                                  title="Открыть источник"
                                              >
                                                ↗
                                              </a>
                                          )}
                                        </div>
                                    )}
                                    <div className="mt-2 flex flex-wrap items-center gap-2">
                                      <select
                                          value={m.horizon ?? ""}
                                          onChange={(e) =>
                                              setModuleFlag(m.id, "horizon", e.target.value)
                                          }
                                          className={`rounded-full border-0 px-2 py-0.5 text-[10px] font-semibold outline-none ${flagCls(
                                              "horizon",
                                              m.horizon
                                          )}`}
                                      >
                                        <option value="">⏱ срок?</option>
                                        <option value="now">Сейчас</option>
                                        <option value="future">В перспективе</option>
                                      </select>
                                      <select
                                          value={m.sourcing ?? ""}
                                          onChange={(e) =>
                                              setModuleFlag(m.id, "sourcing", e.target.value)
                                          }
                                          className={`rounded-full border-0 px-2 py-0.5 text-[10px] font-semibold outline-none ${flagCls(
                                              "sourcing",
                                              m.sourcing
                                          )}`}
                                      >
                                        <option value="">🛠 реализация?</option>
                                        <option value="self">Своя разработка</option>
                                        <option value="integrate">Интеграция</option>
                                      </select>
                                      <select
                                          value={m.tier ?? ""}
                                          onChange={(e) =>
                                              setModuleFlag(m.id, "tier", e.target.value)
                                          }
                                          className={`rounded-full border-0 px-2 py-0.5 text-[10px] font-semibold outline-none ${flagCls(
                                              "tier",
                                              m.tier
                                          )}`}
                                      >
                                        <option value="">★ значимость?</option>
                                        <option value="core">Основное</option>
                                        <option value="optional">Дополнительное</option>
                                      </select>
                                    </div>
                                  </div>
                                </div>
                              </div>
                          );
                        })}
                  </div>
                  <div className={`h-fit rounded-2xl p-4 ${c.subtle}`}>
                    <h3 className="mb-2 text-sm font-bold">➕ Добавить свой элемент</h3>
                    <input
                        className={`mb-2 w-full rounded-xl px-3 py-2 text-sm ${c.input}`}
                        placeholder="Название"
                        value={customName}
                        onChange={(e) => setCustomName(e.target.value)}
                    />
                    <textarea
                        rows={3}
                        className={`mb-2 w-full rounded-xl px-3 py-2 text-sm ${c.input}`}
                        placeholder="Описание"
                        value={customDesc}
                        onChange={(e) => setCustomDesc(e.target.value)}
                    />
                    <div className="mb-1 flex flex-wrap gap-2">
                      <select
                          value={customHorizon}
                          onChange={(e) =>
                              setCustomHorizon(e.target.value as "now" | "future")
                          }
                          className={`rounded-full border-0 px-2 py-1 text-[11px] font-semibold ${flagCls(
                              "horizon",
                              customHorizon
                          )}`}
                      >
                        <option value="now">Сейчас</option>
                        <option value="future">В перспективе</option>
                      </select>
                      <select
                          value={customSourcing}
                          onChange={(e) =>
                              setCustomSourcing(e.target.value as "self" | "integrate")
                          }
                          className={`rounded-full border-0 px-2 py-1 text-[11px] font-semibold ${flagCls(
                              "sourcing",
                              customSourcing
                          )}`}
                      >
                        <option value="self">Своя разработка</option>
                        <option value="integrate">Интеграция</option>
                      </select>
                      <select
                          value={customTier}
                          onChange={(e) =>
                              setCustomTier(e.target.value as "core" | "optional")
                          }
                          className={`rounded-full border-0 px-2 py-1 text-[11px] font-semibold ${flagCls(
                              "tier",
                              customTier
                          )}`}
                      >
                        <option value="core">Основное</option>
                        <option value="optional">Дополнительное</option>
                      </select>
                    </div>
                    {customSourcing === "integrate" && (
                        <input
                            className={`mb-2 w-full rounded-xl px-3 py-2 text-xs ${c.input}`}
                            placeholder="🔗 ссылка на источник интеграции"
                            value={customLink}
                            onChange={(e) => setCustomLink(e.target.value)}
                        />
                    )}
                    <button
                        className={`${btn} w-full ${c.secondary}`}
                        onClick={addCustomModule}
                    >
                      Добавить
                    </button>
                  </div>
                </div>

                <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex flex-wrap gap-2">
                    <button className={`${btn} ${c.secondary}`} onClick={() => goStep(1)}>
                      ← Назад
                    </button>
                    <button
                        className={`${btn} bg-violet-600 text-white hover:bg-violet-700`}
                        onClick={buildSchema}
                    >
                      🧱 Собрать схему
                    </button>
                  </div>
                  <button className={`${btn} ${primary}`} onClick={goReadiness}>
                    К анализу готовности →
                  </button>
                </div>

                {state.levels.length > 0 && (
                    <div
                        className={`mt-7 rounded-3xl p-5 ${
                            dark
                                ? "border border-slate-800 bg-slate-900"
                                : "border border-slate-200 bg-slate-50"
                        }`}
                    >
                      <div
                          className={`mb-5 rounded-2xl border-l-4 border-l-[#0A4DA2] p-4 ${
                              dark ? "bg-blue-500/10" : "bg-[#0A4DA2]/5"
                          }`}
                      >
                        <div className="font-extrabold">🎯 Стратегический контекст</div>
                        <div className={`text-sm ${c.muted}`}>
                          Сценарий: {scenarioMap[state.scenario]?.label} · Инициатива:{" "}
                          {state.initiative
                              ? state.initiative.slice(0, 90) + "…"
                              : "не указана"}
                        </div>
                      </div>

                      {state.levels.map((lvl, i) => (
                          <div key={lvl.id}>
                            <div
                                className={`rounded-2xl p-4 ${c.tile}`}
                                onDragOver={(e) => e.preventDefault()}
                                onDrop={() => onLevelDrop(lvl.id)}
                            >
                              <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                                <div
                                    className="flex-1 border-l-4 border-l-[#0A4DA2] pl-2.5 font-extrabold outline-none"
                                    contentEditable
                                    suppressContentEditableWarning
                                    onBlur={(e) =>
                                        renameLevel(lvl.id, e.currentTarget.textContent || "")
                                    }
                                >
                                  {lvl.title}
                                </div>
                                <button
                                    className="rounded-full bg-red-500/15 px-3 py-1 text-xs text-red-500 hover:bg-red-500/25"
                                    onClick={() => deleteLevel(lvl.id)}
                                >
                                  🗑 удалить слой
                                </button>
                              </div>
                              <div className="flex min-h-[60px] flex-wrap gap-2.5">
                                {lvl.moduleIds.length === 0 && (
                                    <div className={`p-2 text-xs italic ${c.muted}`}>
                                      перетащите сюда элементы
                                    </div>
                                )}
                                {lvl.moduleIds.map((mid) => {
                                  const m = moduleById(mid);
                                  if (!m) return null;
                                  return (
                                      <div
                                          key={mid}
                                          draggable
                                          onDragStart={() => onModuleDragStart(mid, lvl.id)}
                                          className={`relative min-w-[180px] flex-1 cursor-grab rounded-xl p-3 ${
                                              dark
                                                  ? "border border-slate-700 bg-slate-800"
                                                  : "border border-slate-200 bg-white shadow-sm"
                                          }`}
                                      >
                                        <div className="pr-5 text-xs font-extrabold">
                                          {m.name}
                                        </div>
                                        {m.tz && (
                                            <div className={`mt-0.5 inline-block rounded-full px-1.5 py-0.5 text-[9px] font-semibold ${c.chip}`}>
                                              ТЗ {m.tz}
                                            </div>
                                        )}
                                        <div className="mt-0.5 flex flex-wrap gap-1">
                                          {m.tier && (
                                              <span className={`rounded-full px-1.5 py-0.5 text-[9px] font-semibold ${flagCls("tier", m.tier)}`}>
                                    {TIER_LABEL[m.tier]}
                                  </span>
                                          )}
                                          {m.horizon && (
                                              <span className={`rounded-full px-1.5 py-0.5 text-[9px] font-semibold ${flagCls("horizon", m.horizon)}`}>
                                    {HORIZON_LABEL[m.horizon]}
                                  </span>
                                          )}
                                          {m.sourcing && (
                                              <span className={`rounded-full px-1.5 py-0.5 text-[9px] font-semibold ${flagCls("sourcing", m.sourcing)}`}>
                                    {SOURCING_LABEL[m.sourcing]}
                                  </span>
                                          )}
                                          {m.sourcing === "integrate" && m.link && (
                                              <a
                                                  href={m.link}
                                                  target="_blank"
                                                  rel="noopener noreferrer"
                                                  className={`rounded-full px-1.5 py-0.5 text-[9px] font-semibold ${c.chip}`}
                                              >
                                                ↗ источник
                                              </a>
                                          )}
                                        </div>
                                        <div className={`text-[11px] ${c.muted}`}>
                                          {m.desc.slice(0, 70)}
                                        </div>
                                        <button
                                            className="absolute right-1.5 top-1.5 grid h-5 w-5 place-items-center rounded-full bg-red-500/20 text-xs text-red-500 hover:bg-red-500/30"
                                            onClick={() => removeModuleFromSchema(mid)}
                                            title="Убрать"
                                        >
                                          ×
                                        </button>
                                      </div>
                                  );
                                })}
                              </div>
                            </div>
                            {i < state.levels.length - 1 && (
                                <div className={`my-1.5 text-center text-xs ${c.heading}`}>
                                  ↓ поток данных / событий
                                </div>
                            )}
                          </div>
                      ))}

                      <button
                          onClick={addLevel}
                          className={`mt-2 w-full rounded-2xl border-2 border-dashed py-3 text-sm font-semibold transition ${
                              dark
                                  ? "border-slate-700 text-slate-400 hover:border-slate-600 hover:text-slate-200"
                                  : "border-slate-300 text-slate-500 hover:border-[#0A4DA2] hover:text-[#0A4DA2]"
                          }`}
                      >
                        + Добавить слой
                      </button>

                      <div
                          className={`mt-4 space-y-4 rounded-2xl p-4 ${
                              dark ? "bg-black/30" : "border border-slate-200 bg-white"
                          }`}
                      >
                        <div>
                          <h4 className="mb-1.5 font-bold">🔬 Технологии</h4>
                          <div className="flex flex-wrap gap-2">
                            {techStack.map((t) => (
                                <span
                                    key={t}
                                    className={`rounded-full px-3 py-1 text-xs ${c.chip}`}
                                >
                          {t}
                        </span>
                            ))}
                          </div>
                        </div>

                        <div>
                          <h4 className="mb-1.5 font-bold">
                            🌐 Внешние продукты{" "}
                            <span className={`text-xs font-normal ${c.muted}`}>
                        (интегрируем)
                      </span>
                          </h4>
                          <div className="flex flex-wrap gap-2">
                            {EXTERNAL_RESOURCES.map((r) =>
                                    r.link ? (
                                        <a
                                            key={r.label}
                                            href={r.link}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className={`rounded-full px-3 py-1 text-xs ${flagCls(
                                                "sourcing",
                                                "integrate"
                                            )}`}
                                        >
                                          {r.label} ↗
                                        </a>
                                    ) : (
                                        <span
                                            key={r.label}
                                            className={`rounded-full px-3 py-1 text-xs ${flagCls(
                                                "sourcing",
                                                "integrate"
                                            )}`}
                                        >
                            {r.label}
                          </span>
                                    )
                            )}
                          </div>
                        </div>

                        <div>
                          <h4 className="mb-1.5 font-bold">
                            🏛 Внутренние продукты{" "}
                            <span className={`text-xs font-normal ${c.muted}`}>
                        (делаем сами)
                      </span>
                          </h4>
                          <div className="flex flex-wrap gap-2">
                            {INTERNAL_RESOURCES.map((r) => (
                                <span
                                    key={r}
                                    className={`rounded-full px-3 py-1 text-xs ${flagCls(
                                        "sourcing",
                                        "self"
                                    )}`}
                                >
                          {r}
                        </span>
                            ))}
                          </div>
                        </div>

                        <div>
                          <h4 className="mb-1.5 font-bold">
                            🖥 Внешние программно-аппаратные ресурсы{" "}
                            <span className={`text-xs font-normal ${c.muted}`}>
                        (аренда облака — под агентов, дешевле)
                      </span>
                          </h4>
                          <div className="flex flex-wrap gap-2">
                            {EXTERNAL_HARDWARE.map((r) => (
                                <span
                                    key={r}
                                    className={`rounded-full px-3 py-1 text-xs ${flagCls(
                                        "sourcing",
                                        "integrate"
                                    )}`}
                                >
                          {r}
                        </span>
                            ))}
                          </div>
                        </div>

                        <div>
                          <h4 className="mb-1.5 font-bold">
                            🗄 Внутренние программно-аппаратные ресурсы{" "}
                            <span className={`text-xs font-normal ${c.muted}`}>
                        (свои серверы — под обучение нейросетей, дороже)
                      </span>
                          </h4>
                          <div className="flex flex-wrap gap-2">
                            {INTERNAL_HARDWARE.map((r) => (
                                <span
                                    key={r}
                                    className={`rounded-full px-3 py-1 text-xs ${flagCls(
                                        "sourcing",
                                        "self"
                                    )}`}
                                >
                          {r}
                        </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                )}
              </section>
          )}

          {/* ШАГ 3 — Готовность и проекты */}
          {state.step === 3 && (
              <section className={`mb-6 rounded-3xl p-6 sm:p-7 ${c.card}`}>
                <h2 className={`mb-4 text-xl font-extrabold ${c.heading}`}>
                  Анализ готовности → проекты
                </h2>
                <div className="grid gap-4 sm:grid-cols-2">
                  {(["resources", "actions"] as const).map((kind) => (
                      <div key={kind}>
                        <div className="mb-3 flex items-center justify-between gap-2">
                          <h3 className="text-sm font-bold">
                            {kind === "resources"
                                ? "🧰 Необходимые ресурсы"
                                : "✅ Необходимые действия"}
                          </h3>
                          <button
                              className={`rounded-full px-3 py-1 text-xs ${c.chip}`}
                              onClick={() => addCheck(kind)}
                          >
                            + пункт
                          </button>
                        </div>
                        {state[kind].map((it) => (
                            <div
                                key={it.id}
                                className={`mb-2 flex items-center gap-2 rounded-xl px-3 py-2 ${c.tile}`}
                            >
                              <input
                                  type="checkbox"
                                  className="h-4 w-4 accent-[#0A4DA2]"
                                  checked={it.checked}
                                  onChange={() => toggleCheck(kind, it.id)}
                              />
                              <input
                                  className={`flex-1 bg-transparent text-sm outline-none ${
                                      dark ? "text-slate-100" : "text-slate-800"
                                  }`}
                                  value={it.text}
                                  onChange={(e) => editCheck(kind, it.id, e.target.value)}
                              />
                              <button
                                  className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-red-500/20 text-xs text-red-500 hover:bg-red-500/30"
                                  onClick={() => deleteCheck(kind, it.id)}
                              >
                                ×
                              </button>
                            </div>
                        ))}
                      </div>
                  ))}
                </div>

                <div className="mt-4">
                  <button className={`${btn} ${primary}`} onClick={makeProjects}>
                    🚀 Предложить проекты
                  </button>
                </div>

                {state.projects.length > 0 && (
                    <div className="mt-6">
                      <h3 className="mb-3 font-bold">
                        📦 Пул проектов (быстрые / стратегические)
                      </h3>
                      <div className="grid gap-3 sm:grid-cols-2">
                        {state.projects.map((p) => (
                            <div
                                key={p.id}
                                className={`relative flex flex-col gap-2 rounded-2xl p-4 ${c.tile} border-l-4 ${
                                    p.type === "quick"
                                        ? "border-l-[#0A4DA2]"
                                        : "border-l-violet-500"
                                }`}
                            >
                              <button
                                  className="absolute right-2 top-2 grid h-6 w-6 place-items-center rounded-full bg-red-500/20 text-red-500 hover:bg-red-500/30"
                                  onClick={() => deleteProject(p.id)}
                              >
                                ×
                              </button>
                              <select
                                  className={`w-fit rounded-md px-2 py-1 text-xs ${c.input}`}
                                  value={p.type}
                                  onChange={(e) => editProject(p.id, "type", e.target.value)}
                              >
                                <option value="quick">Быстрый</option>
                                <option value="strategic">Стратегический</option>
                              </select>
                              <input
                                  className={`rounded-lg px-2 py-1.5 text-sm font-bold ${c.input}`}
                                  value={p.name}
                                  onChange={(e) => editProject(p.id, "name", e.target.value)}
                              />
                              <textarea
                                  rows={2}
                                  className={`rounded-lg px-2 py-1.5 text-sm ${c.input}`}
                                  value={p.activities}
                                  onChange={(e) =>
                                      editProject(p.id, "activities", e.target.value)
                                  }
                              />
                              <input
                                  className={`rounded-lg px-2 py-1.5 text-xs ${c.input}`}
                                  value={p.kpi}
                                  onChange={(e) => editProject(p.id, "kpi", e.target.value)}
                              />
                            </div>
                        ))}
                      </div>
                      <button
                          className={`${btn} mt-4 ${c.secondary}`}
                          onClick={addProject}
                      >
                        + Добавить проект вручную
                      </button>
                    </div>
                )}

                <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
                  <button className={`${btn} ${c.secondary}`} onClick={() => goStep(2)}>
                    ← К элементам
                  </button>
                  <button
                      className={`${btn} ${primary}`}
                      onClick={() => {
                        if (state.projects.length === 0) makeProjects();
                        goStep(4);
                      }}
                  >
                    К дорожной карте →
                  </button>
                </div>
              </section>
          )}

          {/* ШАГ 4 — Дорожная карта */}
          {state.step === 4 && (
              <section className={`mb-6 rounded-3xl p-6 sm:p-7 ${c.card}`}>
                <h2 className={`mb-2 text-xl font-extrabold ${c.heading}`}>
                  Дорожная карта (диаграмма Ганта)
                </h2>
                <p className={`mb-4 text-sm ${c.muted}`}>
                  Перетаскивайте полосы, чтобы менять сроки; тяните за правый край,
                  чтобы менять длительность. Полные названия проектов — в левой
                  колонке.
                </p>
                {renderGantt(true)}
                <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
                  <button className={`${btn} ${c.secondary}`} onClick={() => goStep(3)}>
                    ← К проектам
                  </button>
                  <button className={`${btn} ${primary}`} onClick={() => goStep(5)}>
                    К итоговому отчёту →
                  </button>
                </div>
              </section>
          )}

          {/* ШАГ 5 — Итоговый отчёт */}
          {state.step === 5 && (
              <section
                  id="report-section"
                  className={`mb-6 rounded-3xl p-6 sm:p-7 ${c.card}`}
              >
                <h2 className={`mb-4 text-xl font-extrabold ${c.heading}`}>
                  Итоговый отчёт группы
                </h2>
                <div className="space-y-6">
                  <div className={`border-b border-dashed ${c.border} pb-5`}>
                    <h3 className={`mb-2 font-bold ${c.heading}`}>Контекст</h3>
                    <p className="text-sm leading-relaxed">
                      <strong>Направление:</strong>{" "}
                      {directionsMap[state.direction]?.name}
                      <br />
                      <strong>Сценарий:</strong> {scenarioMap[state.scenario]?.label} (
                      {scenarioMap[state.scenario]?.focus})
                      <br />
                      <strong>Ключевая инициатива:</strong> {state.initiative}
                    </p>
                  </div>

                  <div className={`border-b border-dashed ${c.border} pb-5`}>
                    <h3 className={`mb-2 font-bold ${c.heading}`}>
                      Схема образа будущего
                    </h3>
                    {state.levels.length === 0 && (
                        <p className={`text-sm ${c.muted}`}>
                          Схема ещё не собрана (шаг 2).
                        </p>
                    )}
                    {state.levels.map((lvl) => (
                        <div key={lvl.id} className="mb-1 text-sm">
                          <strong>{lvl.title}:</strong>{" "}
                          {lvl.moduleIds
                              .map((id) => moduleById(id)?.name)
                              .filter(Boolean)
                              .join(", ") || "—"}
                        </div>
                    ))}
                    <div className="mt-2 flex flex-wrap gap-2">
                      {techStack.map((t) => (
                          <span
                              key={t}
                              className={`rounded-full px-3 py-1 text-xs ${c.chip}`}
                          >
                      {t}
                    </span>
                      ))}
                    </div>
                  </div>

                  <div className={`border-b border-dashed ${c.border} pb-5`}>
                    <h3 className={`mb-2 font-bold ${c.heading}`}>Готовность</h3>
                    <div className="grid gap-4 text-sm sm:grid-cols-2">
                      <div>
                        <strong>Ресурсы</strong>
                        <ul className="mt-1 space-y-1">
                          {state.resources.map((r) => (
                              <li key={r.id}>
                                {r.checked ? "✅" : "⬜"} {r.text}
                              </li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <strong>Действия</strong>
                        <ul className="mt-1 space-y-1">
                          {state.actions.map((a) => (
                              <li key={a.id}>
                                {a.checked ? "✅" : "⬜"} {a.text}
                              </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>

                  <div className={`border-b border-dashed ${c.border} pb-5`}>
                    <h3 className={`mb-2 font-bold ${c.heading}`}>Проекты</h3>
                    <div className="grid gap-4 text-sm sm:grid-cols-2">
                      <div>
                        <strong>Быстрые</strong>
                        <ul className="mt-1 space-y-1">
                          {state.projects
                              .filter((p) => p.type === "quick")
                              .map((p) => (
                                  <li key={p.id}>
                                    {p.name} — {p.kpi}
                                  </li>
                              ))}
                        </ul>
                      </div>
                      <div>
                        <strong>Стратегические</strong>
                        <ul className="mt-1 space-y-1">
                          {state.projects
                              .filter((p) => p.type === "strategic")
                              .map((p) => (
                                  <li key={p.id}>
                                    {p.name} — {p.kpi}
                                  </li>
                              ))}
                        </ul>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className={`mb-2 font-bold ${c.heading}`}>Дорожная карта</h3>
                    {renderGantt(false)}
                  </div>
                </div>

                <div className="mt-6 flex justify-between gap-3 print:hidden">
                  <button className={`${btn} ${c.secondary}`} onClick={() => goStep(4)}>
                    ← К дорожной карте
                  </button>
                  <button
                      className={`${btn} ${primary}`}
                      onClick={() => window.print()}
                  >
                    ⬇ Сохранить отчёт (PDF / печать)
                  </button>
                </div>
              </section>
          )}

          <footer className={`mt-8 text-center text-xs ${c.muted} print:hidden`}>
            Конструктор ИИ-трансформации · Модуль 2 · СамГМУ 2026 · данные хранятся
            в этом браузере (localStorage)
          </footer>
        </div>

        {showModel && (
            <div
                onClick={() => setShowModel(false)}
                className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 print:hidden"
            >
              <div
                  onClick={(e) => e.stopPropagation()}
                  className="relative max-h-[92vh] w-full max-w-6xl overflow-auto rounded-2xl bg-white p-3 shadow-2xl"
              >
                <button
                    onClick={() => setShowModel(false)}
                    className="absolute right-3 top-3 z-10 grid h-8 w-8 place-items-center rounded-full bg-slate-200 text-slate-700 hover:bg-slate-300"
                >
                  ×
                </button>
                <img
                    src="/model.svg"
                    alt="Модель поведения интеллектуального ассистента"
                    className="h-auto w-full"
                />
              </div>
            </div>
        )}
      </div>
  );
}