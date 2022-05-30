import _ from 'lodash';

/**
 * 日志记录
 *
 * 注：配置装载过程中，框架 logger 并未完成初始化，此处直接对 console 方法包装
 */
export class Logger {
    /**
     * 输出日志
     * @param msg
     */
    public static log(msg: any) {
        console.log(msg);
    }

    /**
     * 输出异常日志
     * @param msg
     */
    public static error(msg: any) {
        console.error(msg);
    }

    /**
     * 输出水平线
     */
    public static horizontalRule() {
        console.log(_.repeat('-', 40));
    }
}
