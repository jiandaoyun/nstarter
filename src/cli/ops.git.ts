import simpleGit, { outputHandler, SimpleGit } from 'simple-git';
import { logger } from '../logger';
import { formatStdOutput } from '../utils';

/**
 * git 日志输出处理
 * @private
 */
const _gitLogHandler: outputHandler = (cmd, stdout, stderr) => {
    logger.debug(cmd);
    stdout.on('data', (data) => logger.debug(formatStdOutput(data)));
    stderr.on('data', (data) => logger.warn(formatStdOutput(data)));
};

/**
 * 初始化 git 操作对象
 * @param templatePath - 模板工程路径
 */
const _initGit = async (templatePath?: string): Promise<SimpleGit|undefined> => {
    const git = simpleGit(templatePath).outputHandler(_gitLogHandler);
    if (!templatePath) {
        // 未创建 repo 无需校验有效性
        return git;
    }
    // 检查 git 仓库有效
    if (!await git.checkIsRepo()) {
        logger.warn(`"${ templatePath }" is not a git repository.`);
        return;
    }
    return git;
};

/**
 * 创建 git 模板缓存
 * @param templatePath - 模板工程路径
 * @param templateUri - 模板工程远端地址
 */
export const gitCloneTemplate = async (templatePath: string, templateUri: string) => {
    const git = await _initGit();
    git && await git.clone(templateUri, templatePath);
};

/**
 * 更新模板缓存
 * @param templatePath - 模板工程路径
 */
export const gitUpdateTemplate = async (templatePath: string) => {
    const git = await _initGit(templatePath);
    git && await git.pull();
};

/**
 * 检查模板版本
 * @param templatePath - 模板工程路径
 */
export const gitCheckTemplateVersion = async (templatePath: string): Promise<string | undefined> => {
    const git = await _initGit(templatePath);
    if (!git) {
        return;
    }
    const localRev = (await git.revparse(['--short', 'HEAD']))
        .replace('\n', '');
    const re = new RegExp(`^${ localRev }\\w+\\trefs/heads/(master|main)`);
    const remoteHeads = (await git.listRemote(['--heads']))
        .split('\n').filter((head) => !!head.match(re));
    if (remoteHeads.length === 0) {
        return;
    }
    return localRev;
};
