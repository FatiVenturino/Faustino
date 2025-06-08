import { auth } from '../auth.js';
import { CONFIG } from '../config.js';

class ReportesManager {
    constructor() {
        this.reportes = {
            productos: [],
            categorias: [],
            temporal: []
        };
        this.filtros = {
            fechaInicio: null,
            fechaFin: null,
            categoria: null,
            producto: null
        };
        this.initializeElements();
        this.setupEventListeners();
        this.checkAdminAccess();
        this.loadCategorias();
        this.loadProductos();
        this.loadReportes();
    }

    initializeElements() {
        // Filtros
        this.categoria = document.getElementById('categoria');
        this.producto = document.getElementById('producto');
        this.btnFiltrar = document.getElementById('btnFiltrar');
        this.periodoSelect = document.getElementById('periodoSelect');

        // Tablas
        this.tablaProductos = document.getElementById('tablaProductos').querySelector('tbody');
        this.tablaCategorias = document.getElementById('tablaCategorias').querySelector('tbody');
        this.tablaTemporal = document.getElementById('tablaTemporal').querySelector('tbody');

        // Resumen
        this.totalVentasGlobal = document.getElementById('totalVentasGlobal');
    }

    setupEventListeners() {
        // Eventos de filtros
        this.btnFiltrar.addEventListener('click', () => this.loadReportes());
        this.categoria.addEventListener('change', () => this.loadProductos());
        this.periodoSelect.addEventListener('change', () => this.loadReportes());
    }

    async checkAdminAccess() {
        const isAdmin = await auth.checkAdminStatus();
        if (!isAdmin) {
            window.location.href = '/index.html';
        }
    }

    async loadCategorias() {
        try {
            const response = await fetch(`${CONFIG.API_URL}/categorias`, {
                headers: auth.getAuthHeader()
            });
            
            if (!response.ok) {
                throw new Error('Error al cargar categorías');
            }
            
            const data = await response.json();
            
            if (!data.success) {
                throw new Error(data.message || 'Error al cargar categorías');
            }
            
            // Asegurar que categorias sea un array
            const categorias = Array.isArray(data.categorias) ? data.categorias : [];
            
            this.categoria.innerHTML = '<option value="">Todas las categorías</option>';
            categorias.forEach(categoria => {
                this.categoria.innerHTML += `
                    <option value="${categoria.id}">${categoria.nombre}</option>
                `;
            });
            
        } catch (error) {
            console.error('Error:', error);
            this.showAlert('Error al cargar categorías', 'danger');
        }
    }

    async loadProductos() {
        try {
            const categoriaId = this.categoria.value;
            const params = new URLSearchParams();
            if (categoriaId) params.append('categoria', categoriaId);
            
            const response = await fetch(`${CONFIG.API_URL}/productos?${params}`, {
                headers: auth.getAuthHeader()
            });
            
            if (!response.ok) {
                throw new Error('Error al cargar productos');
            }
            
            const data = await response.json();
            
            if (!data.success) {
                throw new Error(data.message || 'Error al cargar productos');
            }
            
            // Asegurar que productos sea un array
            const productos = Array.isArray(data.productos) ? data.productos : [];
            
            this.producto.innerHTML = '<option value="">Todos los productos</option>';
            productos.forEach(producto => {
                this.producto.innerHTML += `
                    <option value="${producto.id}">${producto.nombre}</option>
                `;
            });
            
        } catch (error) {
            console.error('Error:', error);
            this.showAlert('Error al cargar productos', 'danger');
        }
    }

    async loadReportes() {
        try {
            const params = new URLSearchParams({
                categoria: this.categoria.value || '',
                producto: this.producto.value || '',
                periodo: this.periodoSelect.value
            });

            console.log('Realizando petición a reportes con parámetros:', params.toString());

            const response = await fetch(`${CONFIG.API_URL}/reportes/ventas?${params}`, {
                headers: auth.getAuthHeader()
            });
            
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ message: 'Error desconocido' }));
                throw new Error(errorData.message || `Error ${response.status}: ${response.statusText}`);
            }
            
            const data = await response.json();
            console.log('Datos de reportes recibidos:', data);
            this.reportes = data;
            this.updateUI();
        } catch (error) {
            console.error('Error al cargar reportes:', error);
            this.showAlert('Error al cargar reportes: ' + error.message, 'danger');
        }
    }

    updateUI() {
        if (!this.reportes || !this.reportes.success) {
            // Si no hay reportes o la respuesta no fue exitosa, limpiar las tablas y el resumen
            this.updateResumen(0); // Pasa 0 para limpiar el total de ventas global
            this.renderTablaProductos([]);
            this.renderTablaCategorias([]);
            this.renderTablaTemporal([]); 
            return;
        }
        
        // Actualizar resumen
        const { totalventasglobal, temporal, productos, categorias } = this.reportes;
        
        // Asegurar que los datos sean arrays (aunque ya se hace una verificación en loadReportes, mejor prevenir aquí también)
        const temporalData = Array.isArray(temporal) ? temporal : [];
        const productosData = Array.isArray(productos) ? productos : [];
        const categoriasData = Array.isArray(categorias) ? categorias : [];

        console.log('[DEBUG] Datos para productosData:', productosData);
        console.log('[DEBUG] Datos para categoriasData:', categoriasData);
        
        // Actualizar gráficos y tablas con los datos
        this.updateResumen(totalventasglobal);
        this.updateGraficoVentas(temporalData);
        this.updateTablaProductos(productosData);
        this.updateTablaCategorias(categoriasData);
    }

    updateResumen(totalVentasGlobal) {
        console.log('[DEBUG] Valor para totalVentasGlobal:', totalVentasGlobal);
        this.totalVentasGlobal.textContent = this.formatCurrency(totalVentasGlobal);
    }

    updateGraficoVentas(temporalData) {
        // Por ahora, solo limpiar la tabla temporal si no hay datos
        this.renderTablaTemporal(temporalData);
    }

    updateTablaProductos(productosData) {
        this.renderTablaProductos(productosData);
    }

    updateTablaCategorias(categoriasData) {
        this.renderTablaCategorias(categoriasData);
    }

    renderTablaProductos(productosData) {
        this.tablaProductos.innerHTML = productosData.map(prod => {
            const cantidadVendida = parseFloat(prod.cantidadvendida) || 0;
            const totalVendido = parseFloat(prod.totalvendido) || 0;
            return `
                <tr>
                    <td>${prod.nombre || 'N/A'}</td>
                    <td>${prod.categoria || 'N/A'}</td>
                    <td>${cantidadVendida}</td>
                    <td>${this.formatCurrency(totalVendido)}</td>
                </tr>
            `;
        }).join('');
    }

    renderTablaCategorias(categoriasData) {
        this.tablaCategorias.innerHTML = categoriasData.map(cat => {
            const cantidadProductos = parseFloat(cat.cantidadproductos) || 0;
            const totalVendido = parseFloat(cat.totalvendido) || 0;
            return `
                <tr>
                    <td>${cat.nombre || 'N/A'}</td>
                    <td>${cantidadProductos}</td>
                    <td>${this.formatCurrency(totalVendido)}</td>
                </tr>
            `;
        }).join('');
    }

    renderTablaTemporal(temporalData) {
        this.tablaTemporal.innerHTML = temporalData.map(item => {
            const cantidadPedidos = parseFloat(item.cantidadpedidos) || 0;
            const totalVendido = parseFloat(item.totalvendido) || 0;
            return `
                <tr>
                    <td>${item.nombre || 'N/A'}</td>
                    <td>${cantidadPedidos}</td>
                    <td>${this.formatCurrency(totalVendido)}</td>
                </tr>
            `;
        }).join('');
    }

    async exportarReporte() {
        // Esta función ha sido eliminada ya que el botón de exportación se eliminó del frontend.
        // Si en el futuro se necesita una funcionalidad de exportación, se deberá reimplementar.
        console.warn('La función exportarReporte ha sido llamada, pero la funcionalidad fue eliminada.');
        this.showAlert('La funcionalidad de exportación ha sido deshabilitada.', 'info');
    }

    formatCurrency(amount) {
        return new Intl.NumberFormat('es-AR', {
            style: 'currency',
            currency: 'ARS'
        }).format(amount);
    }

    showAlert(message, type) {
        const alertDiv = document.createElement('div');
        alertDiv.className = `alert alert-${type} alert-dismissible fade show`;
        alertDiv.innerHTML = `
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        `;

        const container = document.querySelector('.container');
        container.insertBefore(alertDiv, container.firstChild);

        setTimeout(() => alertDiv.remove(), 5000);
    }
}

// Inicializar el manager cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    window.reportesManager = new ReportesManager();
}); 