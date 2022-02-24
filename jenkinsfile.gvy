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
                withCredentials([string(credentialsId: 'npm_release_token', variable: 'token')]) {
                    sh(script: "echo //registry.npmjs.org/:_authToken=${env.token} >> .npmrc")
                    sh(script: 'docker build .')
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