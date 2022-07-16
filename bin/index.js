#!/usr/bin/env node
const { Command } = require('commander');
const { getExtensions, uninstallExtension, installExtension } = require('../src/base');
const { logger } = require('../src/utils');

const program = new Command();

program.name('vscc').description('VSCode控制器').version('1.0.0');

program.command('open').description('打开文件或者文件指定行列').argument('[string]', '文件路径');

program
  .command('le')
  .description('列举所有安装的插件')
  .action(() => {
    getExtensions().then((list) => {
      const result = list
        .map((item) => {
          return `${item.publisher}.${item.name}@${item.version}`;
        })
        .join('\n');
      logger.log(result);
    });
  });

program
  .command('ie')
  .description('安装插件')
  .argument('<extension>', 'publisher.name<@<vesrion>>格式的插件名')
  .option('-f, --force', '是否不显示弹窗')
  .action((ext, options) => {
    installExtension(ext, options.force);
  });

program
  .command('ue')
  .description('卸载插件')
  .argument('<extension>', 'Extension formatted with publisher.extension')
  .action((ext) => {
    uninstallExtension(ext).then((res) => {
      if (res) {
        logger.log(res);
      }
    });
  });

program.parse();
