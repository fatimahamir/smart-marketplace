import { Pagination as BSPagination } from 'react-bootstrap';

const Pagination = ({ currentPage, totalPages, onPageChange }) => {
  if (totalPages <= 1) return null;

  const pages = [];
  const start = Math.max(1, currentPage - 2);
  const end = Math.min(totalPages, currentPage + 2);

  for (let i = start; i <= end; i++) {
    pages.push(
      <BSPagination.Item key={i} active={i === currentPage} onClick={() => onPageChange(i)}>
        {i}
      </BSPagination.Item>
    );
  }

  return (
    <BSPagination className="justify-content-center mt-4">
      <BSPagination.Prev disabled={currentPage === 1} onClick={() => onPageChange(currentPage - 1)} />
      {start > 1 && <BSPagination.Item onClick={() => onPageChange(1)}>1</BSPagination.Item>}
      {start > 2 && <BSPagination.Ellipsis disabled />}
      {pages}
      {end < totalPages - 1 && <BSPagination.Ellipsis disabled />}
      {end < totalPages && (
        <BSPagination.Item onClick={() => onPageChange(totalPages)}>{totalPages}</BSPagination.Item>
      )}
      <BSPagination.Next disabled={currentPage === totalPages} onClick={() => onPageChange(currentPage + 1)} />
    </BSPagination>
  );
};

export default Pagination;
