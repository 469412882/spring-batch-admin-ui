import {
  Badge,
  Button,
  Card,
  Col,
  Form,
  Input,
  Row,
  Select,
  message,
  Table,
  Divider
} from 'antd';
import React, { Component, Fragment } from 'react';

import { Dispatch, Action } from 'redux';
import { FormComponentProps } from 'antd/es/form';
import { PageHeaderWrapper } from '@ant-design/pro-layout';
import { ColumnProps } from 'antd/es/table';
import { connect } from 'dva';
import moment from 'moment';
import { StateType } from './models/springBatch';
import { TableListItem, TableListParams } from './data';

import styles from './style.less';
import { PaginationProps } from 'antd/es/pagination/Pagination';
import _ from 'lodash';
import Tag from 'antd/es/tag';

const FormItem = Form.Item;
const { Option } = Select;

const STATUS = ['COMPLETED', 'STARTING', 'STARTED', 'STOPPING', 'STOPPED', 'FAILED', 'ABANDONED', 'UNKNOWN'];

interface TableListProps extends FormComponentProps {
  dispatch: Dispatch<
    Action<
      | 'springBatch/load'
      | 'springBatch/stop'
      | 'springBatch/restart'
      | 'springBatch/abandon'
      | 'springBatch/startNextInstance'
    >
  >;
  loading: boolean;
  springBatch: StateType;
}

interface TableListState {
  formValues: { [key: string]: string };
}

/* eslint react/no-multi-comp:0 */
@connect(
  ({
    springBatch,
    loading,
  }: {
    springBatch: StateType;
    loading: {
      models: {
        [key: string]: boolean;
      };
    };
  }) => ({
    springBatch,
    loading: loading.models.jobRunDetail,
  }),
)
class TableList extends Component<TableListProps> {
  state: TableListState = {
    formValues: {}
  }

  columns: ColumnProps<TableListItem>[] = [
    {
      title: '任务名称',
      dataIndex: 'jobName',
    },
    {
      title: '执行编号',
      dataIndex: 'jobExecutionId',
    },
    {
      title: '版本',
      dataIndex: 'version',
    },
    {
      title: '状态',
      dataIndex: 'status',
      render: (tag: string) => {
        let color: string;
        if (_.isEqual(tag, 'COMPLETED')) {
          color = 'green';
        } else if (_.isEqual(tag, 'STARTING') || _.isEqual(tag, 'STARTED')) {
          color = 'orange';
        } else if (_.isEqual(tag, 'FAILED') || _.isEqual(tag, 'ABANDONED')) {
          color = 'red';
        } else {
          color = 'volcano';
        }
        return (
          <Tag color={color} key={tag}>
            {tag}
          </Tag>
        );
      },
    },
    {
      title: '开始时间',
      dataIndex: 'startTime',
      render: (val: string) => <span>{moment(val).format('YYYY-MM-DD HH:mm:ss')}</span>,
    },
    {
      title: '结束时间',
      dataIndex: 'endTime',
      render: (val: string) => <span>{moment(val).format('YYYY-MM-DD HH:mm:ss')}</span>,
    },
    {
      title: '最后更新时间',
      dataIndex: 'lastUpdated',
      render: (val: string) => <span>{moment(val).format('YYYY-MM-DD HH:mm:ss')}</span>,
    },
    {
      title: '结束代码',
      dataIndex: 'exitCode',
    },
    {
      title: '操作',
      render: (text, record) => {
        return <Fragment>
          {(_.isEqual(record.status, 'STARTING') || _.isEqual(record.status, 'STARTED')) ?
            <span>
              <a onClick={() => this.handleStopped(record)}>停止</a>
              <Divider type="vertical" />
            </span> : null
          }
          {!(_.isEqual(record.status, 'COMPLETED') || _.isEqual(record.status, 'ABANDONED')) ?
            <span>
              <a onClick={() => this.handleAbandon(record)}>放弃</a>
              <Divider type="vertical" />
            </span> : null
          }
          <a onClick={() => this.handleRestart(record)}>重新开始</a>
          <Divider type="vertical" />
          <a onClick={() => this.handleStartNextInstance(record)}>开始下一个</a>
        </Fragment>
      },
    },
  ];

  componentDidMount() {
    const { dispatch } = this.props;
    dispatch({
      type: 'springBatch/load',
      payload: {},
    });
  }

  handleFormReset = () => {
    const { form, dispatch } = this.props;
    form.resetFields();
    this.setState({
      formValues: {},
    });
    dispatch({
      type: 'springBatch/load',
      payload: {},
    });
  };

  handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const { dispatch, form } = this.props;
    form.validateFields((err, fieldsValue) => {
      if (err) return;

      const params: Partial<TableListParams> = {
        status: fieldsValue.Status,
        name: fieldsValue.JobName,
      };

      dispatch({
        type: 'springBatch/load',
        payload: params,
      });
    });
  };

  handleStopped = (fields: TableListItem) => {
    const { dispatch } = this.props;
    dispatch({
      type: 'springBatch/stop',
      payload: {
        jobExecutionId: fields.jobExecutionId,
      },
    });

    message.success('停止成功！');
  };

  handleAbandon = (fields: TableListItem) => {
    const { dispatch } = this.props;
    dispatch({
      type: 'springBatch/abandon',
      payload: {
        jobExecutionId: fields.jobExecutionId,
      },
    });

    message.success('放弃成功！');
  };

  handleRestart = (fields: TableListItem) => {
    const { dispatch } = this.props;
    dispatch({
      type: 'springBatch/restart',
      payload: {
        jobExecutionId: fields.jobExecutionId,
      },
    });

    message.success('重启成功！');
  };

  handleStartNextInstance = (fields: TableListItem) => {
    const { dispatch } = this.props;
    dispatch({
      type: 'springBatch/startNextInstance',
      payload: {
        jobName: fields.jobName,
      },
    });

    message.success('开启成功');
  };

  handleStandardTableChange = (
    pagination: Partial<PaginationProps>,
  ) => {
    const { dispatch } = this.props;
    const { formValues } = this.state;

    const params: Partial<TableListParams> = {
      currentPage: pagination.current,
      pageSize: pagination.pageSize,
      status: formValues.Status,
      name: formValues.JobName,
    };
    dispatch({
      type: 'springBatch/load',
      payload: params,
    });
  };

  renderForm() {
    const { form } = this.props;
    const { getFieldDecorator } = form;
    return (
      <Form onSubmit={this.handleSearch} layout="inline">
        <Row gutter={{ md: 8, lg: 24, xl: 48 }}>
          <Col md={8} sm={24}>
            <FormItem label="任务名称">
              {getFieldDecorator('JobName')(<Input placeholder="请输入" />)}
            </FormItem>
          </Col>
          <Col md={8} sm={24}>
            <FormItem label="使用状态">
              {getFieldDecorator('Status')(
                <Select placeholder="请选择" allowClear={true} style={{ width: '100%' }}>
                  {STATUS.map((item, index) => (<Option value={item}>{item}</Option>))}
                </Select>,
              )}
            </FormItem>
          </Col>
          <Col md={8} sm={24}>
            <span className={styles.submitButtons}>
              <Button type="primary" htmlType="submit">
                查询
              </Button>
              <Button style={{ marginLeft: 8 }} onClick={this.handleFormReset}>
                重置
              </Button>
            </span>
          </Col>
        </Row>
      </Form>
    );
  }

  render() {
    const {
      springBatch: { data },
      loading
    } = this.props;

    const { content, pageable, totalElements } = data;

    const paginationProps = pageable
      ? {
        showSizeChanger: true,
        showQuickJumper: true,
        total: totalElements,
        showTotal: ((total: number) => {
          return `共 ${total} 条`;
        }),
        current: pageable.pageNumber ? pageable.pageNumber + 1 : 1,
        pageSize: pageable.pageSize,
      }
      : false;

    return (
      <PageHeaderWrapper>
        <Card bordered={false}>
          <div className={styles.tableList}>
            <div className={styles.tableListForm}>{this.renderForm()}</div>
            <Table
              dataSource={content}
              columns={this.columns}
              rowKey={row => row.jobExecutionId}
              pagination={paginationProps}
              loading={loading}
              onChange={this.handleStandardTableChange}
            />
          </div>
        </Card>
      </PageHeaderWrapper>
    );
  }
}

export default Form.create<TableListProps>()(TableList);
