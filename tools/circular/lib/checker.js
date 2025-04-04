import _ from 'lodash';
import madge from 'madge';

export class CircularChecker {
    constructor (path, config) {
        this._path = path;
        this._options = {
            baseDir: null,
            excludeRegExp: false,
            fileExtensions: ['ts'],
            includeNpm: false,
            rankdir: 'LR',
            layout: 'dot',
            detectiveOptions: {
                ts: {
                    mixedImports: true,
                    skipTypeImports: true
                },
                es6: {
                    mixedImports: true,
                    skipTypeImports: true
                }
            },
            ...config
        };
        this._circularObj = {};
        this._obj = {};
        this._circular = [];
        this._files = {};
    }

    /**
     * 执行检查
     */
    async check() {
        const res = await madge(this._path, this._options);
        this._madge = res;
        this._circular = res.circular();
        this._obj = res.obj();
        this._files = _.keys(this._obj);
        this._buildCircularTree();
        // 注入 madge 取值行为
        this._madge.obj = () => this._circularObj;
        this._madge.circular = () => this._circular;
        return this;
    }

    _addCircular(path, dependencies) {
        if (this._circularObj[path]) {
            this._circularObj[path] = [...this._circularObj[path], dependencies];
        } else {
            this._circularObj[path] = dependencies;
        }
    }

    _filterCircularFile(circularList) {
        if (circularList.length <= 1) {
            return true;
        }
        return _.every(circularList, (item) =>
            // 基础目录在 service 或 components 目录下
            /(services|components)\//.test(item)
        );
    }

    _buildCircularTree() {
        const allCircularItems = _.flatten(this._circular);
        const circular = [];
        _.forEach(this._circular, (circularList) => {
            // 根据自定义规则过滤循环依赖
            if (this._filterCircularFile(circularList)) {
                return;
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
