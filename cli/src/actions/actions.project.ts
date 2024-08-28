import fs from 'fs-extra';
import path from 'path';
import _ from 'lodash';
import { promisify } from 'util';
import { Logger } from 'nstarter-core';

import { DEFAULT_REPO_TAG } from '../constants';
import type { IDependencyMap, IPackageConf, TDependencyType } from '../installer';
import * as TemplateActions from './actions.template';
import type { IDeployArguments } from '../cli';
import { ProjectInstaller } from '../installer';
import { promptNpmInstall, promptProjectDeploy, promptRepoPrepare, promptTemplateSelect } from '../prompts';


/**
 * 读取 package.json
 * @param pkgDir - package.json 文件目录
 */
export const loadPkg = (pkgDir: string) => {
    const pkgPath = path.join(pkgDir, './package.json');
    if (!fs.existsSync(pkgPath)) {
        throw new Error(`"package.json" not found at "${ pkgPath }"`);
    }
    return JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));
};

/**
 * 保存 package.json
 * @param pkgDir - package.json 目录
 * @param pkg - package 配置
 */
export const savePkg = (pkgDir: string, pkg: IPackageConf) => {
    const pkgPath = path.join(pkgDir, './package.json');
    fs.writeJsonSync(pkgPath, pkg, {
        spaces: 2
    });
};

/**
 * 获取版本号信息
 * @param version
 */
export const getSemVer = (version?: string) => {
    if (!version) {
        return;
    }
    return version.match(/^([\^~]?)(?<version>[\w.-]+)/)?.groups!['version'];
};

/**
 * 替换工程中的包依赖
 * @param tgtDeps - 被修改的目标原始依赖
 * @param tplDeps - 模板依赖
 * @param isStrict - 是否严格取代
 */
export const replacePkgDependency = (tgtDeps: IDependencyMap, tplDeps: IDependencyMap, isStrict: boolean) => {
    for (const key in tgtDeps) {
        if (!tgtDeps[key]) {
            continue;
        }
        const tplVer = tplDeps[key];
        const isStdVer = !/[<>]/.test(tplVer);
        if (!isStrict && isStdVer) {
            // 宽松版本模式下，只替换 semver 版本数字，不变更范围限定模式
            const newVer = getSemVer(tplVer);
            const oriVer = getSemVer(tgtDeps[key]);
            if (newVer && oriVer && oriVer !== newVer) {
                Logger.info(`upgrade [${ key }] ${ oriVer } -> ${ newVer }`);
                tgtDeps[key] = tgtDeps[key].replace(oriVer, newVer);
            }
        } else {
            // 直接替换模模板版本
            tgtDeps[key] = tplVer;
        }
    }
    return tgtDeps;
};

/**
 * 升级工程 package 配置s
 * @param tgtPkg - 被修改的目标 package 配置
 * @param tplPkg - 模板 package 配置
 * @param isStrict - 是否严格取代
 */
export const upgradePkg = (tgtPkg: IPackageConf, tplPkg: IPackageConf, isStrict: boolean) => {
    const upgradeDepTypes: TDependencyType[] = ['dependencies', 'devDependencies', 'peerDependencies'];
    for (const depType of upgradeDepTypes) {
        if (tgtPkg[depType] && tplPkg[depType]) {
            tgtPkg[depType] = replacePkgDependency(tgtPkg[depType]!, tplPkg[depType]!, isStrict);
        }
    }
    return tgtPkg;
};


/**
 * 基于模板工程更新目标工程
 * @param target - 目标工程目录位置
 * @param repoTag - 仓库标签，默认为 default
 * @param tplTag - 模板标签
 * @param isStrict - 是否严格取代
 */
export const upgradeWithTemplate = (target = './', repoTag = DEFAULT_REPO_TAG, tplTag = '', isStrict = false) => {
    const templatePath = TemplateActions.getTemplatePath(repoTag, tplTag);
    if (!fs.pathExistsSync(templatePath) || _.isEmpty(fs.readdirSync(templatePath))) {
        Logger.error('Could not find local template cache');
        return;
    }
    try {
        const newPkg = upgradePkg(
            loadPkg(target),
            loadPkg(path.join(templatePath, './')),
            isStrict,
        );
        savePkg(target, newPkg);
    } catch (err) {
        Logger.error((err as Error).message);
    }
};

/**
 * 部署工程
 * @param args 部署参数
 */
export const deployProject = async (args: IDeployArguments) => {
    // 选择模板 & 初始化
    const { repo, template } = await promptTemplateSelect(args);
    await promptRepoPrepare({ ...args, repo });
    const project = new ProjectInstaller(repo, template);

    // 选择部署模块
    const deployConf = await promptProjectDeploy(args, project);
    if (!deployConf.confirm && !args.yes) {
        return;
    }
    // 部署工程
    await project.initializeProject(deployConf);

    // npm 初始化
    if (!args.yes) {
        if (!deployConf.confirm) {
            // 未部署直接跳过操作
            return;
        }
        // 确认是否需要安装 npm
        const answers = await promptNpmInstall();
        if (!answers.npm) {
            Logger.info('Skip npm install by user.');
            return;
        }
    }
    await promisify(project.npmInitialize)(deployConf);

    Logger.info('deploy job finished.');
};
