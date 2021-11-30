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
            script {
                sh(script: "rm .npmrc", label: "clear token")
            }
        }
    }
}
