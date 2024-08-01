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
        stage('Release') {
            steps {
                withCredentials([string(credentialsId: 'npm_release_token', variable: 'TOKEN')]) {
                    sh(script: "docker build --build-arg TOKEN=${env.TOKEN} .")
                }
            }
        }
    }
}