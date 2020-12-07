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
                sh(script: "make build")
            }
        }
        stage('Publish') {
            steps {
                withCredentials([string(credentialsId: 'npm_release_token', variable: 'TOKEN')]) {
                    sh(script: "make release TOKEN=${env.TOKEN}")
                }
            }
        }
    }
    post {
        success {
            publishHTML(
                reportName: '代码质量报告',
                reportDir: 'lint',
                reportFiles: 'eslint.html',
                reportTitles: '代码质量',
                allowMissing: true,
                alwaysLinkToLastBuild: true,
                keepAll: false
            )
            publishHTML(
                reportName: '单元测试覆盖率报告',
                reportDir: 'coverage/lcov-report',
                reportFiles: 'index.html',
                reportTitles: '覆盖率',
                allowMissing: true,
                alwaysLinkToLastBuild: true,
                keepAll: false
            )
        }
    }
}
