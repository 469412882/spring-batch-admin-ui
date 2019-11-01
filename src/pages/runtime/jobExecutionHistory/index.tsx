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
  Table
} from 'antd';
import React, { Component, Fragment } from 'react';

import { Dispatch, Action } from 'redux';
import { FormComponentProps } from 'antd/es/form';
import { PageHeaderWrapper } from '@ant-design/pro-layout';
import { SorterResult,ColumnProps } from 'antd/es/table';
import { connect } from 'dva';
import moment from 'moment';
import { StateType } from './models/jobExecutionHistory';
import { TableListItem, TableListPagination, TableListParams } from './data';

import styles from './style.less';

const FormItem = Form.Item;
const { Option } = Select;
const getValue = (obj: { [x: string]: string[] }) =>
  Object.keys(obj)
    .map(key => obj[key])
    .join(',');

type IStatusMapType = 'default' | 'processing' | 'success' | 'error';
//const statusMap = ['default', 'processing', 'success', 'error'];
const STATUS = ['COMPLETED', 'STARTING', 'STARTED', 'STOPPING', 'STOPPED', 'FAILED', 'ABANDONED', 'UNKNOWN'];

interface TableListProps extends FormComponentProps {
  dispatch: Dispatch<
    Action<
      | 'jobExecutionHistory/fetch'
      | 'jobExecutionHistory/stopped'
    >
  >;
  loading: boolean;
  jobExecutionHistory: StateType;
}

interface TableListState {
  formValues: { [key: string]: string };
}

/* eslint react/no-multi-comp:0 */
@connect(
  ({
    jobExecutionHistory,
    loading,
  }: {
    jobExecutionHistory: StateType;
    loading: {
      models: {
        [key: string]: boolean;
      };
    };
  }) => ({
    jobExecutionHistory,
    loading: loading.models.jobExecutionHistory,
  }),
)
class TableList extends Component<TableListProps> {
  state : TableListState = {
    formValues: {}
  }

  columns:ColumnProps<TableListItem>[] = [
    {
      title: '任务名称',
      dataIndex: 'name',
    },
    {
      title: '执行编号',
      dataIndex: 'runNum',
      sorter: true,
    },
    {
      title: '版本',
      dataIndex: 'version',
    },
    {
      title: '状态',
      dataIndex: 'status',
      filters: [
        {
          text: STATUS[0],
          value: '0',
        },
        {
          text: STATUS[1],
          value: '1',
        },
        {
          text: STATUS[2],
          value: '2',
        },
        {
          text: STATUS[3],
          value: '3',
        },
        {
          text: STATUS[4],
          value: '4',
        },
        {
          text: STATUS[5],
          value: '5',
        },
        {
          text: STATUS[6],
          value: '6',
        },
        {
          text: STATUS[7],
          value: '7'
        }
      ],
      render(val: number) {
        let statusVal:IStatusMapType;
        if(val == 0){
          statusVal = 'success';
        }else if(val == 1 || val == 2){
          statusVal = 'processing';
        }else if(val ==5 || val == 6){
          statusVal = 'error';
        }else{
          statusVal = 'default';
        }
        return <Badge status={statusVal} text={STATUS[val]} />;
      },
    },
    {
      title: '创建时间',
      dataIndex: 'createAt',
      sorter: true,
      render: (val: string) => <span>{moment(val).format('YYYY-MM-DD HH:mm:ss')}</span>,
    },
    {
      title: '开始时间',
      dataIndex: 'startAt',
      sorter: true,
      render: (val: string) => <span>{moment(val).format('YYYY-MM-DD HH:mm:ss')}</span>,
    },
    {
      title: '结束时间',
      dataIndex: 'endAt',
      sorter: true,
      render: (val: string) => <span>{moment(val).format('YYYY-MM-DD HH:mm:ss')}</span>,
    },
    {
      title: '最后更新时间',
      dataIndex: 'updatedAt',
      sorter: true,
      render: (val: string) => <span>{moment(val).format('YYYY-MM-DD HH:mm:ss')}</span>,
    },
    {
      title: '结束代码',
      dataIndex: 'exitCode',
    },
    {
      title: '结束信息',
      dataIndex: 'exitMessage',
    },
    {
      title: '操作',
      render: (text, record) => {
        let hiddenVal :boolean = true;
        if(record.status == 1 || record.status ==2){
          hiddenVal = false;
        }
       return <Fragment> <a hidden={hiddenVal} onClick={() => this.handleStopped(record)}>停止</a></Fragment>
      },
    },
  ];

  componentDidMount() {
    const { dispatch } = this.props;
    dispatch({
      type: 'jobExecutionHistory/fetch',
    });
  }

  handleFormReset = () => {
    const { form, dispatch } = this.props;
    form.resetFields();
    this.setState({
      formValues: {},
    });
    dispatch({
      type: 'jobExecutionHistory/fetch',
      payload: {},
    });
  };

  handleSearch = (e: React.FormEvent) => {
    e.preventDefault();

    const { dispatch, form } = this.props;

    form.validateFields((err, fieldsValue) => {
      if (err) return;

      const values = {
        ...fieldsValue,
        updatedAt: fieldsValue.updatedAt && fieldsValue.updatedAt.valueOf(),
      };

      this.setState({
        formValues: values,
      });

      dispatch({
        type: 'jobExecutionHistory/fetch',
        payload: values,
      });
    });
  };

  handleStopped = (fields: TableListItem) => {
    const { dispatch } = this.props;
    dispatch({
      type: 'jobExecutionHistory/stopped',
      payload: {
        name: fields.name,
        desc: fields.name,
        key: fields.key,
      },
    });

    message.success('停止成功！');
  };

  handleStandardTableChange = (
    pagination: Partial<TableListPagination>,
    filtersArg: Record<keyof TableListItem, string[]>,
    sorter: SorterResult<TableListItem>,
  ) => {
    const { dispatch } = this.props;
    const { formValues } = this.state;

    const filters = Object.keys(filtersArg).reduce((obj, key) => {
      const newObj = { ...obj };
      newObj[key] = getValue(filtersArg[key]);
      return newObj;
    }, {});

    const params: Partial<TableListParams> = {
      currentPage: pagination.current,
      pageSize: pagination.pageSize,
      ...formValues,
      ...filters,
    };
    if (sorter.field) {
      params.sorter = `${sorter.field}_${sorter.order}`;
    }

    dispatch({
      type: 'jobExecutionHistory/fetch',
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
              {getFieldDecorator('name')(<Input placeholder="请输入" />)}
            </FormItem>
          </Col>
          <Col md={8} sm={24}>
            <FormItem label="使用状态">
              {getFieldDecorator('status')(
                <Select placeholder="请选择" allowClear={true} style={{ width: '100%' }}>
                {STATUS.map((item,index) => (<Option value={index}>{item}</Option>))}
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
      jobExecutionHistory: { data },
      loading
    } = this.props;

    const {list,pagination} = data;

    const paginationProps = pagination
    ? {
        showSizeChanger: true,
        showQuickJumper: true,
        ...pagination,
      }
    : false;

    return (
      <PageHeaderWrapper>
        <Card bordered={false}>
          <div className={styles.tableList}>
            <div className={styles.tableListForm}>{this.renderForm()}</div>
            <Table
              dataSource={list}
              columns={this.columns}
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
