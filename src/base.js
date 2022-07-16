/**
 * 基础方法，包括所有无交互且可以被index导出的方法
 */
const path = require('path');
const os = require('os');
const { runCommand, logger } = require('./utils');

// 检查code命令是否存在
async function checkCodeCliExist(cli = 'code') {
  try {
    await runCommand(cli, ['-v']);
    return true;
  } catch (e) {
    return false;
  }
}

async function getCodeCli() {
  async function getCodePath(isInsiders) {
    const code = `code${isInsiders ? '-insiders' : ''}`;
    const isInPath = await checkCodeCliExist(code);

    if (isInPath) return code;

    const platform = os.platform();
    let codeDir = '';
    if (platform === 'darwin') {
      codeDir = '/Applications/Visual Studio Code.app/Contents/Resources/app/bin';
    } else if (platform === 'win32') {
      codeDir = path.join(os.homedir(), 'AppData\\Local\\Programs\\Microsoft VS Code\\bin');
    } else {
      return '';
    }
    const codePath = path.join(codeDir, code);
    const installed = await checkCodeCliExist(codePath);
    return installed ? codePath : '';
  }

  const codePath = await getCodePath();
  const insidersPath = await getCodePath(true);
  if (!codePath && !insidersPath) {
    throw new Error('Please make sure you have installed VSCode correctly');
  }
  return codePath || insidersPath;
}

// not export
async function runCodeCommand(args) {
  return runCommand(await getCodeCli(), args);
}

// not export
async function getIDEVersionInfo() {
  try {
    const output = await runCodeCommand(['-v']);
    const [version, lastCommitId, arch] = output.split('\n');
    return { version, lastCommitId, arch };
  } catch (e) {
    logger.error(e);
    return {};
  }
}

async function getIDEVersion() {
  const { version } = await getIDEVersionInfo();
  return version || '';
}

async function getIDELastCommitId() {
  const { lastCommitId } = await getIDEVersionInfo();
  return lastCommitId || '';
}

async function getIDEArch() {
  const { arch } = await getIDEVersionInfo();
  return arch || '';
}

async function getExtensions() {
  try {
    const output = await runCodeCommand(['--list-extensions', '--show-versions']);
    const list = output.split('\n').filter(Boolean);
    return list
      .map((item) => {
        const matched = /^(.+)\.(.+)@(.+)$/.exec(item);
        return matched
          ? {
              publisher: matched[1],
              name: matched[2],
              version: matched[3],
            }
          : null;
      })
      .filter(Boolean);
  } catch (e) {
    logger.error(e);
    return [];
  }
}

async function checkExtensionInstalled(extension) {
  // Maybe publisher.name or publisher.name.version
  const list = await getExtensions();
  const dotIndex = extension.indexOf('.');
  const atIndex = extension.indexOf('@');
  const publisher = extension.slice(0, dotIndex);
  const name = extension.slice(dotIndex + 1, atIndex > -1 ? atIndex : Infinity);
  const matched = list.find((item) => item.publisher === publisher && item.name === name);
  return matched;
}

async function installExtension(extension, forceHidePrompt = true) {
  if (!extension) {
    return;
  }
  try {
    const installedExt = await checkExtensionInstalled(extension);
    if (installedExt) {
      logger.log(`Already has installed version: ${installedExt.version}`);
    }
    await runCodeCommand(['--install-extension', extension, forceHidePrompt ? '--force' : '']);
  } catch (e) {
    logger.error(e);
  }
}

async function uninstallExtension(extension) {
  try {
    const output = await runCodeCommand(['--uninstall-extension', extension]);
    return output;
  } catch (e) {
    if (e.message.indexOf('is not installed') > -1) {
      logger.error(`${extension} is not installed`);
    }
    return '';
  }
}

module.exports = {
  checkCodeCliExist,
  getCodeCli,
  getIDEVersion,
  getIDELastCommitId,
  getIDEArch,
  getExtensions,
  checkExtensionInstalled,
  installExtension,
  uninstallExtension,
};
