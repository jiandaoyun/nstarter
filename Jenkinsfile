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
        CI = "Jenkins"
    }
    stages {
        stage('Build') {
            steps {
                sh(script: 'make docker-build')
                publishHTML target: [
                    reportName: '单元测试覆盖率报告',
                    reportDir: 'report',
                    reportFiles: 'coverage/lcov-report/index.html',
                    reportTitles: '覆盖率',
                    allowMissing: true,
                    alwaysLinkToLastBuild: true,
                    keepAll: false
                ]
            }
        }
        stage('Release') {
            steps {
                withCredentials([string(credentialsId: 'npm_release_token', variable: 'TOKEN')]) {
                    sh(script: "make docker-release TOKEN=${env.TOKEN}")
                }
            }
        }
    }
    post {
        always {
            script {
                sh(script: 'make clean')
            }
        }
    }
}
