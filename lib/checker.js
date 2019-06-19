'use strict';
const _ = require('lodash');
const path = require('path');
const madge = require('madge');
const escapeRegexp = require('escape-string-regexp');

class CircularChecker {
    constructor (path, config) {
        this._path = path;
        this._options = _.defaults({
            baseDir: null,
            excludeRegExp: false,
            fileExtensions: ['ts'],
            includeNpm: false,
            rankdir: 'LR',
            layout: 'dot'
        }, config);
        this._circularObj = {};
        this._obj = {};
        this._circular = [];
        this._files = {};

        return madge(this._path, this._options).then((res) => {
            this._madge = res;
            this._circular = res.circular();
            this._obj = res.obj();
            this._files = _.keys(this._obj);
            this._buildCircularTree();
            // 注入 madge 取值行为
            this._madge.obj = () => this._circularObj;
            this._madge.circular = () => this._circular;
            return this;
        });
    }

    _addCircular(path, dependencies) {
        if (this._circularObj[path]) {
            this._circularObj[path] = [...this._circularObj[path], dependencies];
        } else {
            this._circularObj[path] = dependencies;
        }
    }

    _filterCircularFile(circularList) {
        const baseDir = path.dirname(circularList[0]);
        // 根据是否使用同级的 container 判定是否为 IoC 调用
        const testerIoC = new RegExp(`^${ escapeRegexp(baseDir) }\/\w*container`);
        const isIoC = !!_.find(circularList, (item) => testerIoC.test(item));
        return isIoC;
    }

    _buildCircularTree() {
        const allCircularItems = _.flatten(this._circular);
        const circular = [];
        _.forEach(this._circular, (circularList) => {
            // 根据自定义规则过滤循环依赖
            if (!this._filterCircularFile(circularList)) {
                return false;
            }
            circular.push(circularList);
            _.forEach(circularList, (circularItem) => {
                this._addCircular(
                    circularItem,
                    _.intersection(this._obj[circularItem], allCircularItems)
                );
            });
        });
        this._circular = circular;
    }

    /**
     * 循环检测方法
     */
    circular() {
        return this._circular;
    }

    /**
     * 绘图方法
     */
    image(imagePath) {
        return this._madge.image(imagePath);
    }

    get madge () {
        return this._madge;
    }
}

module.exports = CircularChecker;
