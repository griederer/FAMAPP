// Tests for Card component
import { render, screen } from '../../utils/testUtils';
import { Card, CardHeader, CardContent, CardFooter, CardTitle, CardDescription } from './Card';

describe('Card Components', () => {
  describe('Card', () => {
    it('should render card with default props', () => {
      render(
        <Card data-testid="card">
          <div>Card content</div>
        </Card>
      );
      
      const card = screen.getByTestId('card');
      expect(card).toBeInTheDocument();
      expect(card).toHaveClass('bg-white', 'border', 'border-gray-200', 'rounded-xl');
      expect(screen.getByText('Card content')).toBeInTheDocument();
    });

    it('should apply custom className', () => {
      render(
        <Card className="custom-card" data-testid="card">
          Content
        </Card>
      );
      
      const card = screen.getByTestId('card');
      expect(card).toHaveClass('custom-card');
    });

    it('should render different variants', () => {
      const { rerender } = render(
        <Card variant="elevated" data-testid="card">
          Content
        </Card>
      );
      
      let card = screen.getByTestId('card');
      expect(card).toHaveClass('shadow-lg');

      rerender(
        <Card variant="outlined" data-testid="card">
          Content
        </Card>
      );
      
      card = screen.getByTestId('card');
      expect(card).toHaveClass('border-2');

      rerender(
        <Card variant="ghost" data-testid="card">
          Content
        </Card>
      );
      
      card = screen.getByTestId('card');
      expect(card).toHaveClass('border-transparent', 'bg-transparent');
    });
  });

  describe('CardHeader', () => {
    it('should render card header', () => {
      render(
        <CardHeader data-testid="header">
          <div>Header content</div>
        </CardHeader>
      );
      
      const header = screen.getByTestId('header');
      expect(header).toBeInTheDocument();
      expect(header).toHaveClass('p-6', 'pb-0');
      expect(screen.getByText('Header content')).toBeInTheDocument();
    });

    it('should apply custom className', () => {
      render(
        <CardHeader className="custom-header" data-testid="header">
          Content
        </CardHeader>
      );
      
      const header = screen.getByTestId('header');
      expect(header).toHaveClass('custom-header');
    });
  });

  describe('CardContent', () => {
    it('should render card content', () => {
      render(
        <CardContent data-testid="content">
          <div>Main content</div>
        </CardContent>
      );
      
      const content = screen.getByTestId('content');
      expect(content).toBeInTheDocument();
      expect(content).toHaveClass('p-6', 'pt-0');
      expect(screen.getByText('Main content')).toBeInTheDocument();
    });

    it('should apply custom className', () => {
      render(
        <CardContent className="custom-content" data-testid="content">
          Content
        </CardContent>
      );
      
      const content = screen.getByTestId('content');
      expect(content).toHaveClass('custom-content');
    });
  });

  describe('CardFooter', () => {
    it('should render card footer', () => {
      render(
        <CardFooter data-testid="footer">
          <div>Footer content</div>
        </CardFooter>
      );
      
      const footer = screen.getByTestId('footer');
      expect(footer).toBeInTheDocument();
      expect(footer).toHaveClass('p-6', 'pt-0');
      expect(screen.getByText('Footer content')).toBeInTheDocument();
    });

    it('should apply custom className', () => {
      render(
        <CardFooter className="custom-footer" data-testid="footer">
          Content
        </CardFooter>
      );
      
      const footer = screen.getByTestId('footer');
      expect(footer).toHaveClass('custom-footer');
    });
  });

  describe('CardTitle', () => {
    it('should render card title', () => {
      render(<CardTitle>Card Title</CardTitle>);
      
      const title = screen.getByText('Card Title');
      expect(title).toBeInTheDocument();
      expect(title).toHaveClass('text-xl', 'font-semibold', 'text-gray-900');
    });

    it('should apply custom className', () => {
      render(<CardTitle className="custom-title">Title</CardTitle>);
      
      const title = screen.getByText('Title');
      expect(title).toHaveClass('custom-title');
    });
  });

  describe('CardDescription', () => {
    it('should render card description', () => {
      render(<CardDescription>Card description text</CardDescription>);
      
      const description = screen.getByText('Card description text');
      expect(description).toBeInTheDocument();
      expect(description).toHaveClass('text-sm', 'text-gray-600');
    });

    it('should apply custom className', () => {
      render(<CardDescription className="custom-desc">Description</CardDescription>);
      
      const description = screen.getByText('Description');
      expect(description).toHaveClass('custom-desc');
    });
  });

  describe('Complete Card Example', () => {
    it('should render complete card with all components', () => {
      render(
        <Card data-testid="complete-card">
          <CardHeader>
            <CardTitle>Sample Card</CardTitle>
            <CardDescription>This is a sample card description</CardDescription>
          </CardHeader>
          <CardContent>
            <p>This is the main content of the card.</p>
          </CardContent>
          <CardFooter>
            <button>Action</button>
          </CardFooter>
        </Card>
      );
      
      const card = screen.getByTestId('complete-card');
      expect(card).toBeInTheDocument();
      
      expect(screen.getByText('Sample Card')).toBeInTheDocument();
      expect(screen.getByText('This is a sample card description')).toBeInTheDocument();
      expect(screen.getByText('This is the main content of the card.')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Action' })).toBeInTheDocument();
    });
  });
});