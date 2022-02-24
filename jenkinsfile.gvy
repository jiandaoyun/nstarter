pipeline {
    agent {
        node { label 'default' }
    }
    options {
        disableConcurrentBuilds()
        buildDiscarder(logRotator(numToKeepStr: '3', artifactNumToKeepStr: '3'))
    }
    environment {
        DOCKER_BUILDKIT = "1"
    }
    stages {
        stage('Build') {
            steps {
                sh(script: 'make docker-build')
                publishHTML target: [
                    reportName: '代码质量报告',
                    reportDir: 'report',
                    reportFiles: 'lint/eslint.html',
                    reportTitles: '代码质量',
                    allowMissing: true,
                    alwaysLinkToLastBuild: true,
                    keepAll: false
                ]
            }
        }
        stage('Release') {
            steps {
                withCredentials([string(credentialsId: 'npm_release_token', variable: 'token')]) {
                    sh(script: "echo //registry.npmjs.org/:_authToken=${env.token} >> .npmrc")
                    sh(script: 'make docker-release')
                }
            }
        }
    }
    post {
        always {
            sh 'make clean'
        }
    }
}