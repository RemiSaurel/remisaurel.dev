export type NewsCategory = "📝 paper" | "👨‍💻 project" | "👥 conference"  | "😎 misc";

interface News {
    date: Date;
    title: string;
    content?: string;
    categories?: NewsCategory[];
    links?: {
        text: string;
        url: string;
    }[]
}

export const news: News[] = [
        {
        date: new Date("2025-09-15"),
        title: "Went to ECTEL conference",
        content: "Very nice conference in Newcastle & Durham! I presented our demo paper about MAESTRO. We had interesting discussions with other researchers about our approach and future work. Both keynotes from Mike Sharples and Dragan Gašević were very inspiring.",
        categories: ["👥 conference", "📝 paper"],
        links: [
            {
                text: "Paper",
                url: "https://hal.science/hal-05141354"
            },
        ]
    },
    {
        date: new Date("2025-07-06"),
        title: "MAESTRO demo paper is available!",
        content: "We introduce 🪄 MAESTRO- a Multi-Agent Educational System for Tutoring and Recommendation Orchestration that orchestrates specialized agent teams tailored to various use cases, such as dynamic indicator selection, intuitive data visualization interpretation, and educator recommendations.",
        categories: ["📝 paper"],
        links: [
            {
                text: "Paper",
                url: "https://hal.science/hal-05141354"
            },
        ]
    },
    {
        date: new Date("2025-06-29"),
        title: "Created evalbuddy tool to facilitate evaluation",
        categories: ["👨‍💻 project", "😎 misc"],
        links: [
            {
                text: "Github",
                url: "https://github.com/remisaurel/evalbuddy"
            },
            {
                text: "Website",
                url: "https://evalbuddy.nuxt.dev/"
            }
        ]
    },
    {
        date: new Date("2025-06-10"),
        title: "Went to my 1st conference (EIAH 2025)",
        categories: ["👥 conference"],
        content: "Amazing experience at EIAH 2025 in Lille! I had the opportunity to present my first paper, meet many people, and attend interesting talks. More details on my blog post.",
        links: [
            {
                text: "Blog post",
                url: "https://remisaurel.dev/posts/eiah-first-conf"
            }
        ]
    },
    {
        date: new Date("2025-06-03"),
        title: "1 demo paper accepted, 1 Blue-Sky paper rejected (ECTEL 2025)",
        categories: ["📝 paper", "👥 conference"],
        content: "As expected, the Blue-Sky paper was rejected (I think we barely missed the acceptance with our -2, -1, 1 and 2 grades). The demo paper about MAESTRO was accepted. We will present it at ECTEL 2025 in September.",
        links: [
            {
                text: "Conference",
                url: "https://ea-tel.eu/organization/ectel-2025"
            }
        ]
    },
    {
        date: new Date("2025-05-10"),
        title: "1st paper accepted (full paper) !!! (EIAH 2025)",
        categories: ["📝 paper"],
        content: " 📄 Intégration responsable de l’IA Générative dans l’Éducation : proposition d’un plan d’actions stratégiques dirigé par les risques liés aux questions éthiques. Rémi Saurel, Franck Silvestre, Jean-Baptiste Raclet, Emmanuel Lescure. 12ème Conférence sur les Environnements Informatiques pour l’Apprentissage Humain (EIAH 2025), ATIEF : Association des Technologies de l’Information pour l’Education et la Formation, Jun 2025, Lille, France. hal-05070808",
        links: [
            {
                text: "Paper",
                url: "https://hal.science/hal-05070808"
            },
            {
                text: "Conference",
                url: "https://eiah2025.sciencesconf.org/"
            }
        ]
    },
    {
        date: new Date("2025-05-06"),
        title: "Talk given to IUT de Rodez about Research and Education",
        categories: ["😎 misc"],
        links: [
            {
                text: "LinkedIn post",
                url: "https://www.linkedin.com/feed/update/urn:li:activity:7325808468269981696/"
            }
        ]
    },
    {
        date: new Date("2025-04-10"),
        title: "Antoine joined us as a full-stack intern for 4 months.",
        categories: ["👨‍💻 project"],
        content: "Antoine will work on the first screens of KDo (Konsolidation Dashboard), but also on the backend and maybe on the AI part.",
        links: [
            {
                text: "Antoine's GitHub",
                url: "https://github.com/antoinemcx"
            }
        ]
    },
    {
        date: new Date("2025-04-15"),
        title: "2 papers submission (1 full, 1 demo) waiting for reviews",
        categories: ["📝 paper"],
        content: "The full paper is basically the same as the one that got rejected. We try to see how another community will react to our work. The demo paper is about a more technical aspect of our work.",
    },
    {
        date: new Date("2025-04-03"),
        title: "1 full paper rejected",
        categories: ["📝 paper"],
        content: "The paper was rejected mainly because the work was still preliminary. Although it was rejected, we had some positive feedback from the reviewers, especially on our position. We will work on it and resubmit it to another conference.",
    },
    {
        date: new Date("2025-03-15"),
        title: "1 full paper submission, waiting for reviews",
        categories: ["📝 paper"],
    },
    {
        date: new Date("2025-03-20"),
        title: "2 focus groups with teachers",
        categories: ["👨‍💻 project", "😎 misc"],
        content: "We work with several French and Mathematics teachers. The goal is to gather their feedback on the first dashboard prototype and to understand their pedagogical needs.",

    },
    {
        date: new Date("2025-02-10"),
        title: "Teaching assistant for the 1st time (Kotlin / Spring Boot / Web)",
        categories: ["😎 misc"],
        content: "Working on Kotlin and Spring Boot at IUT de Toulouse for 3rd year students. More details on the teaching page.",
        links: [
            {
                text: "Teaching",
                url: "https://remisaurel.dev/teaching"
            }
        ]
    },
    {
        date: new Date("2025-01-15"),
        title: "1 full paper submission, waiting for reviews",
        categories: ["📝 paper"],
    },
    {
        date: new Date("2024-12-20"),
        title: "1st draft of a potential paper",
        categories: ["📝 paper"],
    },
    {
        date: new Date("2024-12-04"),
        title: "Reading mode: activated",
        categories: ["😎 misc"],
    },
    {
        date: new Date("2024-11-04"),
        title: "1st day as a PhD student",
        categories: ["😎 misc"],
    },
    
];