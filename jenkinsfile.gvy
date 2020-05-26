pipeline {
    agent {
        node {  'develop' }
    }
    options {
        disableConcurrentBuilds()
        buildDiscarder(logRotator(numToKeepStr: '3', artifactNumToKeepStr: '3'))
    }
    environment {
        NODE_VERSION = 'v12.16.2'
        NODE_MIRROR = 'https://mirrors.tuna.tsinghua.edu.cn/nodejs-release/'
        NPM_TOKEN = credentials('npm_release_token')
    }
    stages {
        stage('Build') {
            steps {
                nvm(
                    version: env.NODE_VERSION,
                    nvmNodeJsOrgMirror: env.NODE_MIRROR
                ) {
                    sh(script: "npm install", label: "install")
                    sh(script: "npm run eslint:html", label: "eslint")
                    sh(script: "npm run build", label: "build")
                }
            }
        }
        stage('Publish') {
            when {
                branch 'master'
            }
            steps {
                nvm(
                    version: env.NODE_VERSION,
                    nvmNodeJsOrgMirror: env.NODE_MIRROR
                ) {
                    sh(script: "npm publish", label: "publish")
                }
            }
        }
    }
    post {
        always {
            publishHTML(
                reportName: '代码质量报告',
                reportDir: 'lint',
                reportFiles: 'eslint.html',
                reportTitles: '代码质量',
                allowMissing: true,
                alwaysLinkToLastBuild: true,
                keepAll: false
            )
        }
    }
}
