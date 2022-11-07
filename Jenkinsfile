#!groovy
pipeline {
    agent any
    environment {
        NODE_VERSION = 'v14.18.1'
        NODE_MIRROR = 'https://mirrors.tuna.tsinghua.edu.cn/nodejs-release/'
        CI = 'JENKINS'
    }
    stages {
        stage('Install') {
            steps {
                nvm(
                    'version': env.NODE_VERSION,
                    'nvmNodeJsOrgMirror': env.NODE_MIRROR
                ) {
                    sh "make install"
                }
            }
        }
        stage('build') {
            steps {
                nvm('version': env.NODE_VERSION) {
                    sh "make lint"
                    sh "make test"
                }
            }
        }
        stage('Publish') {
            steps {
                nvm('version': env.NODE_VERSION) {
                    sh "make upload"
                }
            }
        }
    }
  	post {
        fixed {
            emailext(
                to: 'jdy-dev@fanruan.com',
                subject: "[JENKINS][${env.JOB_NAME}] 构建恢复(${env.BUILD_NUMBER})",
                body: """详情可见: ${BUILD_URL}"""
            )
        }
        regression {
            emailext(
                to: 'jdy-dev@fanruan.com',
                recipientProviders: [[$class: 'FailingTestSuspectsRecipientProvider']],
                subject: "[JENKINS][${env.JOB_NAME}] 构建失败(${env.BUILD_NUMBER})",
                body: """详情可见: ${BUILD_URL}""",
                attachLog: true
            )
        }
        always {
            sh 'make clean'
        }
    }
}
