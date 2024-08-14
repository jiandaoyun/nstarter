pipeline {
    agent {
        node { label 'aliyun' }
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
