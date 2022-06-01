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
        ARGOCD_AUTH_TOKEN = credentials('argo-deploy-token')
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
        stage('Deploy') {
            environment {
                digest = sh(script: "grep -Po '(?<=sha256:)[0-9a-z]+' digest.txt", returnStdout: true)
            }
            steps {
                sh(script: "argocd app set nstarter-docs --kustomize-image ${env.REGISTRY}/nstarter-docs@sha256:$digest")
                sh(script: "argocd app sync nstarter-docs --prune")
            }
        }
    }
}
