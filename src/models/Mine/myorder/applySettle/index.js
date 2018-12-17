import React, { Component } from 'react'
import { Header, Content } from 'Components'
import { List } from 'antd-mobile'
import * as urls from 'Contants/urls'
import api from 'Util/api'
import * as tooler from 'Contants/tooler'
import style from './style.css'
class ApplySettle extends Component {
  constructor(props) {
    super(props)
    this.state = {
      amount: 0,
      recordStatus: tooler.getQueryString('recordStatus'),
      workSheetOrderNo: tooler.getQueryString('workSheetOrderNo'),
      orderno: tooler.getQueryString('orderno'),
      status: tooler.getQueryString('status'),
      dataSource: [],
      isloading: false
    }
  }
  componentDidMount() {
    this.getDatalist()
  }
  getDatalist = async () => {
    this.setState({
      isloading: false
    })
    let { orderno } = this.state
    let data = await api.Mine.myorder.applySettleDetail({
      orderNo: orderno,
      page: 1,
      pageSize: 500
    }) || false
    if (data) {
      this.setState({
        amount: data['amount'],
        dataSource: data['list'],
        isloading: true
      })
    }
  }
  handleApply = async () => { // 申请结算
    let { workSheetOrderNo, orderno } = this.state
    let data = await api.Mine.myorder.acceptApply({
      workSheetOrderNo: workSheetOrderNo,
      orderNo: orderno
    }) || false
    if (data) {
      this.props.match.history.push(urls.MYORDER)
    }
  }
  render() {
    let { dataSource, amount, isloading, status, recordStatus } = this.state
    return <div className='pageBox gray'>
      <Header
        title='申请结算'
        leftIcon='icon-back'
        leftTitle1='返回'
        leftClick1={() => {
          this.props.match.history.go(-1)
        }}
      />
      <Content>
        {
          isloading && dataSource.length !== 0 ? <div style={{ height: '100%' }}>
            <List className={`${style['settle-list']}`}>
              {dataSource.map(i => (
                <List.Item key={i.uid} activeStyle={{ backgroundColor: '#fff' }}>
                  <img className={style['header']} src={i['avatar']} />
                  <div className={style['settle-info']}>
                    <h2>{i.username}</h2>
                    <p>单价：{i.price}元/{i.unit}</p>
                    <p>工作量：{i.workload}{i.unit}</p>
                  </div>
                  <span className={style['price']}>¥{i.amount}</span>
                </List.Item>
              ))}
            </List>
            <div className={style['btn-box']}>
              {
                status === '1' || recordStatus !== null ? '' : <a onClick={this.handleApply}>申请结算</a>
              }
              <span>合计：<em>{amount}元</em></span>
            </div>
          </div> : dataSource.length === 0 && isloading ? <div className='nodata'>暂无数据</div> : null
        }
      </Content>
    </div>
  }
}

export default ApplySettle
