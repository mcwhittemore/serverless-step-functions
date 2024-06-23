'use strict';

const sinon = require('sinon');
const expect = require('chai').expect;
const Serverless = require('serverless/lib/Serverless');
const CLI = require('serverless/lib/classes/CLI');
const AwsProvider = require('serverless/lib/plugins/aws/provider');
const ServerlessStepFunctions = require('./../index');

describe('#compileStateMachines', () => {
  let serverless;
  let serverlessStepFunctions;

  beforeEach(() => {
    serverless = new Serverless();
    serverless.cli = new CLI(serverless);
    serverless.configSchemaHandler = {
      // eslint-disable-next-line no-unused-vars
      defineTopLevelProperty: (propertyName, propertySchema) => {},
    };
    serverless.servicePath = true;
    serverless.service.service = 'step-functions';
    serverless.service.provider.compiledCloudFormationTemplate = {
      Resources: {},
      Outputs: {},
    };
    serverless.setProvider('aws', new AwsProvider(serverless));
    const options = {
      output: './test.md'
    };
    serverlessStepFunctions = new ServerlessStepFunctions(serverless, options);
  });

  it('should work', () => {
    serverless.service.stepFunctions = {
      stateMachines: {
        myStateMachine: {
          name: 'stateMachine',
          definition: {
            StartAt: 'Lambda',
            States: {
              Lambda: {
                Type: 'Task',
                Resource: {
                  Ref: 'MyFunction',
                },
                Next: 'Sns',
              },
              Sns: {
                Type: 'Task',
                Resource: 'arn:aws:states:::sns:publish',
                Parameters: {
                  Message: {
                    'Fn::GetAtt': ['MyTopic', 'TopicName'],
                  },
                  TopicArn: {
                    Ref: 'MyTopic',
                  },
                },
                Next: 'Sqs',
              },
              Sqs: {
                Type: 'Task',
                Resource: 'arn:aws:states:::sqs:sendMessage',
                Parameters: {
                  QueueUrl: {
                    Ref: 'MyQueue',
                  },
                  MessageBody: 'This is a static message',
                },
                Next: 'Fargate',
              },
              Fargate: {
                Type: 'Task',
                Resource: 'arn:aws:states:::ecs:runTask.waitForTaskToken',
                Parameters: {
                  LaunchType: 'FARGATE',
                  Cluster: {
                    Ref: 'ActivityCluster',
                  },
                  NetworkConfiguration: {
                    AwsvpcConfiguration: {
                      AssignPublicIp: 'ENABLED',
                      SecurityGroups: [{
                        Ref: 'ActivitySecurityGroup',
                      }],
                      Subnets: [{
                        Ref: 'ActivitySubnet',
                      }],
                    },
                  },
                },
                Next: 'Parallel',
              },
              Parallel: {
                Type: 'Parallel',
                End: true,
                Branches: [
                  {
                    StartAt: 'Lambda2',
                    States: {
                      Lambda2: {
                        Type: 'Task',
                        Resource: {
                          Ref: 'MyFunction2',
                        },
                        End: true,
                      },
                    },
                  },
                ],
              },
            },
          },
        },
      },
    };

    const writeFile = sinon.fake();

    return serverlessStepFunctions.mermaid(writeFile).then(() => {
      expect(writeFile.called).to.be.equal(true);
      expect(writeFile.firstCall.firstArg).to.be.equal('./test.md');
      expect(writeFile.firstCall.lastArg).to.be.equal('hi');
    });
  });

});
