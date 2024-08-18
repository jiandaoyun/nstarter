import { themes as prismThemes } from 'prism-react-renderer';
import type { Config } from '@docusaurus/types';
import type { Options as DocsOptions } from '@docusaurus/plugin-content-docs';
import type * as Preset from '@docusaurus/preset-classic';

const config: Config = {
    title: 'NStarter Docs',
    tagline: '',
    favicon: 'img/favicon.ico',

    url: 'https://nstarter-docs.jdydevelop.com',
    baseUrl: '/',

    // GitHub pages deployment config.
    organizationName: 'jiandaoyun',
    projectName: 'nstarter',

    onBrokenLinks: 'throw',
    onBrokenMarkdownLinks: 'warn',

    i18n: {
        defaultLocale: 'zh-Hans',
        locales: ['zh-Hans'],
    },

    presets: [
        [
            'classic',
            {
                docs: {
                    routeBasePath: '/docs/',
                    sidebarPath: './sidebars.ts',
                    sidebarCollapsed: false,
                    editUrl:
                        'https://github.com/jiandaoyun/nstarter/tree/master/docs/',
                },
                theme: {
                    customCss: './src/css/custom.css',
                },
            } satisfies Preset.Options,
        ],
    ],
    plugins: [
        [
            '@docusaurus/plugin-content-docs',
            {
                id: 'changes',
                path: './changes',
                routeBasePath: '/changes/',
                sidebarPath: './sidebars.changes.ts'
            } satisfies DocsOptions,
        ],
    ],

    themeConfig: {
        image: 'img/logo.png',
        navbar: {
            title: 'NStarter 开发框架',
            logo: {
                alt: 'nstarter logo',
                src: 'img/logo.png',
            },
            items: [
                {
                    type: 'docSidebar',
                    sidebarId: 'docs',
                    position: 'left',
                    label: '使用文档',
                },
                {
                    to: '/changes/changelog',
                    activeBaseRegex: `/changes`,
                    position: 'left',
                    label: '变更记录',
                },
                {
                    href: 'https://github.com/jiandaoyun/nstarter',
                    label: 'GitHub',
                    position: 'right',
                },
            ],
        },
        footer: {
            style: 'dark',
            links: [
                {
                    title: '文档',
                    items: [
                        {
                            label: 'nstarter 使用文档',
                            to: '/docs/startup',
                        },
                    ],
                },
                {
                    title: '产品',
                    items: [
                        {
                            label: '简道云',
                            href: 'https://www.jiandaoyun.com',
                        },
                        {
                            label: 'Jodoo',
                            href: 'https://www.jodoo.com',
                        },
                    ],
                },
                {
                    title: '更多',
                    items: [
                        {
                            label: 'GitHub',
                            href: 'https://github.com/facebook/docusaurus',
                        },
                    ],
                },
            ],
            copyright: `Copyright © ${new Date().getFullYear()} NStarter Team, Build on 🌍 with 💓.`,
        },
        prism: {
            theme: prismThemes.github,
            darkTheme: prismThemes.dracula,
        },
        algolia: {
            appId: 'EZDMYUN2HC',
            apiKey: 'f7666a3729026d496df59f4b635355bb',

            indexName: 'nstarter_doc_index',
            contextualSearch: true,
            externalUrlRegex: 'jiandaoyun\\.com',
            searchParameters: {},
            searchPagePath: 'search',
            insights: false,
        },
    } satisfies Preset.ThemeConfig,
};

export default config;
