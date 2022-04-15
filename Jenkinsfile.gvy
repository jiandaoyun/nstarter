#!groovy
pipeline {
    agent {
        node { label 'default' }
    }

    options {
        disableConcurrentBuilds()
        buildDiscarder(logRotator(numToKeepStr: '5'))
    }

    environment {
        REGISTRY = "harbor.idc-wx.jdy-internal.com/jiandaoyun-test"
    }
    
    stages {
        stage('Build') {
            steps {
                sh(script: 'make docker-build', label: 'build')
                withDockerRegistry(credentialsId: "harbor-registry", url: "https://${env.REGISTRY}") {
                    sh(script: 'make docker-push DOCKER_REGISTRY=${REGISTRY}', label: 'push')
                }
            }
        }
    }
}
