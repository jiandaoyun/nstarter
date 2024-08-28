import type { outputHandler, SimpleGit } from 'simple-git';
import simpleGit from 'simple-git';
import { Logger } from 'nstarter-core';
import { formatStdOutput } from '../utils';


/**
 * git 日志输出处理
 * @private
 */
const _gitLogHandler: outputHandler = (cmd, stdout, stderr) => {
    Logger.debug(cmd);
    stdout.on('data', (data) => Logger.debug(formatStdOutput(data)));
    stderr.on('data', (data) => Logger.warn(formatStdOutput(data)));
};

/**
 * 初始化 git 操作对象
 * @param repoPath - 模板工程路径
 */
export const initRepo = async (repoPath?: string): Promise<SimpleGit|undefined> => {
    const git = simpleGit(repoPath).outputHandler(_gitLogHandler);
    if (!repoPath) {
        // 未创建 repo 无需校验有效性
        return git;
    }
    // 检查 git 仓库有效
    if (!await git.checkIsRepo()) {
        Logger.warn(`"${ repoPath }" is not a git repository.`);
        return;
    }
    return git;
};

/**
 * 创建 git 模板缓存
 * @param repoPath - 模板工程路径
 * @param repoUri - 模板工程远端地址
 */
export const cloneRepo = async (repoPath: string, repoUri: string) => {
    const git = await initRepo();
    git && await git.clone(repoUri, repoPath);
};

/**
 * 更新模板缓存
 * @param repoPath - 模板工程路径
 */
export const updateRepo = async (repoPath: string) => {
    const git = await initRepo(repoPath);
    git && await git.pull();
};

/**
 * 检查模板版本
 * @param repoPath - 模板工程路径
 */
export const checkRepoVersion = async (repoPath: string): Promise<string | undefined> => {
    const git = await initRepo(repoPath);
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

