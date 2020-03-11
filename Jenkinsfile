node {
    def dockerImage

    if( "${env.BRANCH_NAME}" == "master" ) {
        stage('Pull') {
                checkout scm
            }

            stage('Build Image') {
                def commitHash = sh(returnStdout: true, script: 'git rev-parse HEAD').trim().take(7)
                dockerImage = docker.build("tg-bot-ccc:${commitHash}")
            }

            stage('Push') {
                docker.withRegistry('https://hub.tuku.tech') {
                    dockerImage.push()
                }
            }
    }
}
