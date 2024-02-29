import { useEffect, useState } from 'react'

import CustomerDetails from './components/CustomerDetails'
import EmptySate from './components/EmptyState'
import Input from './components/Input'
import Footer from './components/Footer'
import Header from './components/Header'
import Pagination from './components/Pagination'
import SizeFilter from './components/SizeFilter'
import Table from './components/Table'

const serverPort = 3001
const serverURL = `http://localhost:${serverPort}`

const CustomerApp = () => {
  const [name, setName] = useState('')
  const [customers, setCustomers] = useState([])
  const [customer, setCustomer] = useState(null)

  const [paginationInfo, setPaginationInfo] = useState(() => ({
    currentPage: 1,
    totalPages: 1,
    limit: parseInt(localStorage.getItem('paginationLimit'), 10) || 10,
  }))
  const [currentPage, setCurrentPage] = useState(1)

  const [sortCriteria, setSortCriteria] = useState('size')
  const [sortOrder, setSortOrder] = useState('desc')

  const [initialFetchDone, setInitialFetchDone] = useState(false)

  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'light')

  const [sizeFilter, setSizeFilter] = useState('')

  useEffect(() => {
    localStorage.setItem('theme', theme)
    document.body.setAttribute('data-theme', theme)
  }, [theme])

  useEffect(() => {
    localStorage.setItem('paginationLimit', paginationInfo.limit.toString())
  }, [paginationInfo.limit])

  useEffect(() => {
    getCustomers(currentPage, paginationInfo.limit, sizeFilter)
  }, [currentPage, paginationInfo.limit, sizeFilter])

  async function getCustomers(page, limit, sizeFilter) {
    try {
      const response = await fetch(`${serverURL}/customers`, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ page, limit, size: sizeFilter })
      })
      const jsonResponse = await response.json()
      const { customers, pageInfo } = jsonResponse

      setCustomers(customers)
      setPaginationInfo(prevState => ({ ...prevState, currentPage: pageInfo.currentPage, totalPages: pageInfo.totalPages }))
    } catch (error) {
      console.error(error)
    } finally {
      setInitialFetchDone(true)
    }
  }

  const sortCustomers = (criteria) => {
    if (sortCriteria === criteria) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortOrder('desc')
    }
    setSortCriteria(criteria)
  }

  const sortedCustomers = [...customers].sort((a, b) => {
    const order = sortOrder === 'asc' ? 1 : -1
    if (sortCriteria === 'size') {
      const mapSizeToNumber = (size) => {
        switch (size.toLowerCase()) {
          case 'small': return 1
          case 'medium': return 2
          case 'big': return 3
          default: return 0
        }
      }
      return order * (mapSizeToNumber(a[sortCriteria]) - mapSizeToNumber(b[sortCriteria]))
    }
    return order * (a[sortCriteria] - b[sortCriteria])
  })

  const sortHandler = (header) => sortCustomers(header)

  const handleInputChange = (e) => setName(e.target.value)

  const customerClickHandler = (customer) => setCustomer(customer)
  const handleCustomerDetailsBackButtonClick = () => setCustomer(null)

  const handleLimitChange = (e) => {
    const newLimit = parseInt(e.target.value, 10)
    setPaginationInfo(prevState => ({ ...prevState, limit: newLimit }))
    setCurrentPage(1)
  }

  const handlePaginationPrevClick = () =>
    setCurrentPage(prev => Math.max(prev - 1, 1))
  const handlePaginationNextClick = () =>
    setCurrentPage(prev => (prev < paginationInfo.totalPages ? prev + 1 : prev))

  const toggleTheme = () => {
    setTheme(prevTheme => prevTheme === 'light' ? 'dark' : 'light')
  }

  const handleFilterChange = (e) => {
    setSizeFilter(e.target.value)
    setCurrentPage(1)
  }

  return (
    <div className="container">
      <Header theme={theme} onClick={toggleTheme} />
      <Input
        customer={customer}
        customers={customers}
        onChange={handleInputChange}
      />
      {!customer ? (
        <SizeFilter sizeFilter={sizeFilter} onChange={handleFilterChange} />
      ) : (
        null
      )}
      {customer ? (
        <CustomerDetails
          customer={customer}
          onClick={handleCustomerDetailsBackButtonClick}
        />
      ) : (
        <div data-testid="table" className="table-container">
          {initialFetchDone && !customers.length ? (
            <EmptySate />
          ) : customers.length ? (
            <>
              <p>Hi <b>{name ? name : 'there'}</b>! It is now <b>{(new Date()).toDateString()}</b>.</p>
              <div>
                <p>Below is our customer list.</p>
                <p>Click on each of them to view their contact details.</p>
                <Table
                  customers={sortedCustomers}
                  customerClickHandler={customerClickHandler}
                  sortCriteria={sortCriteria}
                  sortOrder={sortOrder}
                  sortNumberOfEmployessHandler={() => sortHandler('employees')}
                  sortSizeHandler={() => sortHandler('size')}
                />
                <Pagination
                  currentPage={currentPage}
                  paginationInfo={paginationInfo}
                  onClickPrev={handlePaginationPrevClick}
                  onClickNext={handlePaginationNextClick}
                  onChange={handleLimitChange}
                 />
              </div>
            </>
          ) : null}
        </div>
      )}
    </div>
  )
}

const App = () => (
  <div>
    <CustomerApp />
    <Footer />
  </div>
)

export default App
