#!/usr/bin/env bash
awslocal secretsmanager create-secret --name /helix-deploy/franklin/all --secret-string '[{"my_uname":"username","my_pwd":"password"}]'
