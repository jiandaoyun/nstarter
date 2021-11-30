pipeline {
    agent {
        node { label 'default' }
    }
    options {
        disableConcurrentBuilds()
        buildDiscarder(logRotator(numToKeepStr: '3', artifactNumToKeepStr: '3'))
    }
    environment {
        NODE_VERSION = 'v14.18.1'
        NODE_MIRROR = 'https://mirrors.tuna.tsinghua.edu.cn/nodejs-release/'
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
            steps {
                nvm(
                    version: env.NODE_VERSION,
                    nvmNodeJsOrgMirror: env.NODE_MIRROR
                ) {
                    withCredentials([string(credentialsId: 'npm_release_token', variable: 'token')]) {
                        sh(script: "echo //registry.npmjs.org/:_authToken=${env.token} >> .npmrc")
                        sh(script: "npm whoami")
                        sh(script: "npm publish", label: "publish")
                    }
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
            script {
                sh(script: "rm .npmrc", label: "clear token")
            }
        }
    }
}
